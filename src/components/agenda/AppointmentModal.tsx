
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { i18n } from "@/lib/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, AlertTriangle } from "lucide-react";

import AppointmentClientSelect from "./modal/AppointmentClientSelect";
import AppointmentServiceSelect from "./modal/AppointmentServiceSelect";
import AppointmentDateSelect from "./modal/AppointmentDateSelect";
import AppointmentTimeSelect from "./modal/AppointmentTimeSelect";
import AppointmentNotesField from "./modal/AppointmentNotesField";
import AppointmentStatusSelect from "./modal/AppointmentStatusSelect";
import AppointmentPaymentStatusSelect from "./modal/AppointmentPaymentStatusSelect";
import { useAppointmentForm } from "./modal/useAppointmentForm";

// Types
type Client = Database["public"]["Tables"]["clients"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];

// Updated Appointment type with final_price instead of price
type Appointment = Database["public"]["Tables"]["appointments"]["Row"] & {
  clients?: { name: string; phone?: string } | null;
  appointment_services?: Array<{
    service_id: string;
    final_price: number;
    services: { name: string; duration: number };
  }> | null;
};

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  onSuccess?: () => void;
  selectedDate?: Date;
}

const AppointmentModal = ({
  open,
  onOpenChange,
  appointment,
  onSuccess,
  selectedDate,
}: AppointmentModalProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const isMobile = useIsMobile();

  // Use the custom hook for form handling
  const { form, submitting, onSubmit } = useAppointmentForm({
    appointment,
    onSuccess,
    onOpenChange,
    selectedDate,
    services,
  });

  // Load clients and services
  useEffect(() => {
    fetchClients();
    fetchServices();
  }, []);

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name");

      if (error) {
        console.error("Erro ao carregar clientes:", error);
      } else {
        setClients(data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("name");

      if (error) {
        console.error("Erro ao carregar serviços:", error);
      } else {
        setServices(data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
    } finally {
      setLoadingServices(false);
    }
  };

  // Check if there are services with zero price
  const hasZeroPriceServices = services.some(service => service.price === 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`sm:max-w-[500px] rounded-2xl border-salon-secondary/30 p-0 overflow-hidden
                   ${isMobile ? 'max-w-[90vw] max-h-[85vh]' : 'max-h-[90vh]'}`}
      >
        <DialogHeader className="bg-gradient-to-r from-salon-primary/20 to-salon-rose/20 p-4 sm:p-6 sticky top-0 z-50">
          <DialogTitle className="font-playfair text-xl sm:text-2xl">
            {appointment ? "Editar Agendamento" : "Novo Agendamento"}
          </DialogTitle>
        </DialogHeader>

        {/* Alert for zero price services */}
        {hasZeroPriceServices && (
          <div className="p-4 sm:p-6 pb-0">
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                <div className="flex items-center justify-between">
                  <span>Alguns serviços não têm preço definido.</span>
                  <Link to="/services-management">
                    <Button variant="outline" size="sm" className="gap-2 ml-2">
                      <Settings className="h-3 w-3" />
                      Gerenciar
                    </Button>
                  </Link>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <ScrollArea className="max-h-[calc(85vh-120px)]">
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4 p-4 sm:p-6">
              {/* Client */}
              <AppointmentClientSelect 
                clients={clients} 
                loadingClients={loadingClients} 
                form={form} 
              />

              {/* Services */}
              <AppointmentServiceSelect 
                services={services} 
                form={form} 
              />

              {/* Date */}
              <AppointmentDateSelect form={form} />

              {/* Time */}
              <AppointmentTimeSelect form={form} />

              {/* Notes */}
              <AppointmentNotesField form={form} />

              {/* Status and Payment Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AppointmentStatusSelect form={form} />
                <AppointmentPaymentStatusSelect form={form} />
              </div>

              <DialogFooter className="mt-6 pt-4 border-t border-salon-secondary/20">
                <Button
                  type="button"
                  variant="salon-outline"
                  onClick={() => onOpenChange(false)}
                >
                  {i18n.system.cancel}
                </Button>
                <Button type="submit" variant="salon" disabled={submitting}>
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                      {i18n.system.loading}
                    </div>
                  ) : appointment ? (
                    i18n.system.save
                  ) : (
                    "Agendar"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentModal;
