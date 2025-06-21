
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, DollarSign, Check, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ZeroPriceAppointment {
  id: string;
  start_time: string;
  final_price: number;
  client_name: string;
  services: Array<{
    id: string;
    name: string;
    final_price: number;
    default_price: number;
  }>;
}

interface ZeroPriceAppointmentsFixerProps {
  onSuccess?: () => void;
}

const ZeroPriceAppointmentsFixer = ({ onSuccess }: ZeroPriceAppointmentsFixerProps) => {
  const [appointments, setAppointments] = useState<ZeroPriceAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState<string | null>(null);
  const [priceInputs, setPriceInputs] = useState<Record<string, Record<string, string>>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchZeroPriceAppointments();
  }, []);

  const fetchZeroPriceAppointments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          final_price,
          clients (name),
          appointment_services (
            id,
            final_price,
            services (
              id,
              name,
              price
            )
          )
        `)
        .or('final_price.eq.0,final_price.is.null');

      if (error) throw error;

      const processedAppointments: ZeroPriceAppointment[] = data
        .filter(apt => {
          // Filtrar apenas agendamentos que realmente têm problemas de preço
          const hasZeroFinalPrice = !apt.final_price || apt.final_price === 0;
          const hasZeroServicePrices = apt.appointment_services?.some(
            as => !as.final_price || as.final_price === 0
          );
          return hasZeroFinalPrice || hasZeroServicePrices;
        })
        .map(apt => ({
          id: apt.id,
          start_time: apt.start_time,
          final_price: apt.final_price || 0,
          client_name: apt.clients?.name || 'Cliente não identificado',
          services: apt.appointment_services?.map(as => ({
            id: as.id,
            name: as.services?.name || 'Serviço não identificado',
            final_price: as.final_price || 0,
            default_price: as.services?.price || 0
          })) || []
        }));

      setAppointments(processedAppointments);

      // Inicializar inputs de preço
      const initialInputs: Record<string, Record<string, string>> = {};
      processedAppointments.forEach(apt => {
        initialInputs[apt.id] = {};
        apt.services.forEach(service => {
          // Usar o preço padrão do serviço se o final_price for zero
          const suggestedPrice = service.final_price > 0 
            ? service.final_price 
            : service.default_price;
          initialInputs[apt.id][service.id] = suggestedPrice.toString();
        });
      });
      setPriceInputs(initialInputs);

    } catch (error: any) {
      console.error("Erro ao carregar agendamentos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os agendamentos com preço zero",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleServicePriceChange = (appointmentId: string, serviceId: string, value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPriceInputs(prev => ({
        ...prev,
        [appointmentId]: {
          ...prev[appointmentId],
          [serviceId]: value
        }
      }));
    }
  };

  const fixAppointmentPrices = async (appointmentId: string) => {
    setFixing(appointmentId);
    
    try {
      const appointment = appointments.find(apt => apt.id === appointmentId);
      if (!appointment) return;

      let totalPrice = 0;

      // Atualizar preços dos serviços
      for (const service of appointment.services) {
        const newPrice = parseFloat(priceInputs[appointmentId]?.[service.id] || "0");
        
        if (isNaN(newPrice) || newPrice < 0) {
          throw new Error(`Preço inválido para o serviço ${service.name}`);
        }

        // Atualizar o preço do serviço no agendamento
        const { error: serviceError } = await supabase
          .from('appointment_services')
          .update({ final_price: newPrice })
          .eq('id', service.id);

        if (serviceError) throw serviceError;

        totalPrice += newPrice;
      }

      // Atualizar o preço total do agendamento
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({ final_price: totalPrice })
        .eq('id', appointmentId);

      if (appointmentError) throw appointmentError;

      toast({
        title: "Sucesso",
        description: `Preços do agendamento corrigidos com sucesso (Total: R$ ${totalPrice.toFixed(2)})`
      });

      // Remover o agendamento da lista
      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));

      if (onSuccess) onSuccess();

    } catch (error: any) {
      console.error("Erro ao corrigir preços:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível corrigir os preços",
        variant: "destructive"
      });
    } finally {
      setFixing(null);
    }
  };

  const calculateAppointmentTotal = (appointmentId: string) => {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (!appointment) return 0;

    return appointment.services.reduce((total, service) => {
      const price = parseFloat(priceInputs[appointmentId]?.[service.id] || "0");
      return total + (isNaN(price) ? 0 : price);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Check className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-lg font-medium text-green-700 mb-1">Tudo em ordem!</p>
          <p className="text-gray-600">Não foram encontrados agendamentos com preço zero.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h3 className="text-lg font-medium">
          Agendamentos com Preço Zero ({appointments.length})
        </h3>
      </div>

      {appointments.map((appointment) => {
        const total = calculateAppointmentTotal(appointment.id);
        const isFixing = fixing === appointment.id;

        return (
          <Card key={appointment.id} className="border-amber-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{appointment.client_name}</CardTitle>
                  <p className="text-sm text-gray-600">
                    {format(new Date(appointment.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <Badge variant="destructive" className="gap-1">
                  <DollarSign className="h-3 w-3" />
                  R$ 0,00
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <h4 className="font-medium text-gray-800">Serviços:</h4>
                {appointment.services.map((service) => (
                  <div key={service.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                    <div className="flex-1">
                      <p className="font-medium">{service.name}</p>
                      {service.default_price > 0 && (
                        <p className="text-sm text-gray-600">
                          Preço padrão: R$ {service.default_price.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">R$</span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={priceInputs[appointment.id]?.[service.id] || ""}
                        onChange={(e) => handleServicePriceChange(appointment.id, service.id, e.target.value)}
                        placeholder="0.00"
                        className="w-24"
                        disabled={isFixing}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="text-lg font-medium">
                  Total: R$ {total.toFixed(2)}
                </div>
                <Button
                  onClick={() => fixAppointmentPrices(appointment.id)}
                  disabled={isFixing || total === 0}
                  className="gap-2"
                >
                  {isFixing ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                      Corrigindo...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Corrigir Preços
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ZeroPriceAppointmentsFixer;
