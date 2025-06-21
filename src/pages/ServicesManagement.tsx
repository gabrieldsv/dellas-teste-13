
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Save, DollarSign, Settings, Wrench } from "lucide-react";
import ZeroPriceAppointmentsFixer from "@/components/agenda/ZeroPriceAppointmentsFixer";

type Service = Database["public"]["Tables"]["services"]["Row"];

interface ServiceWithStats extends Service {
  appointments_count: number;
  zero_price_appointments: number;
}

const ServicesManagement = () => {
  const [services, setServices] = useState<ServiceWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchServicesWithStats();
  }, []);

  const fetchServicesWithStats = async () => {
    setLoading(true);
    try {
      // Buscar serviços com estatísticas de agendamentos
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          appointment_services (
            appointment_id,
            final_price,
            appointments (
              id,
              final_price
            )
          )
        `);

      if (error) throw error;

      // Processar os dados para calcular estatísticas
      const servicesWithStats = data.map(service => {
        const appointmentServices = service.appointment_services || [];
        const appointments_count = appointmentServices.length;
        const zero_price_appointments = appointmentServices.filter(
          as => (as.final_price || 0) === 0
        ).length;

        return {
          ...service,
          appointments_count,
          zero_price_appointments
        };
      });

      setServices(servicesWithStats);
      
      // Inicializar inputs de preço
      const initialPrices: Record<string, string> = {};
      servicesWithStats.forEach(service => {
        initialPrices[service.id] = service.price?.toString() || "0";
      });
      setPriceInputs(initialPrices);

    } catch (error: any) {
      console.error("Erro ao carregar serviços:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os serviços",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (serviceId: string, value: string) => {
    // Permitir apenas números e ponto decimal
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPriceInputs(prev => ({
        ...prev,
        [serviceId]: value
      }));
    }
  };

  const updateServicePrice = async (serviceId: string) => {
    const newPrice = parseFloat(priceInputs[serviceId] || "0");
    
    if (isNaN(newPrice) || newPrice < 0) {
      toast({
        title: "Erro",
        description: "Preço inválido",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('services')
        .update({ price: newPrice })
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Preço do serviço atualizado com sucesso"
      });

      // Atualizar o estado local
      setServices(prev => prev.map(service => 
        service.id === serviceId 
          ? { ...service, price: newPrice }
          : service
      ));

    } catch (error: any) {
      console.error("Erro ao atualizar preço:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o preço",
        variant: "destructive"
      });
    }
  };

  const updateAllServicePrices = async () => {
    setSaving(true);
    try {
      const updates = services.map(service => ({
        id: service.id,
        price: parseFloat(priceInputs[service.id] || "0")
      }));

      for (const update of updates) {
        if (isNaN(update.price) || update.price < 0) {
          throw new Error(`Preço inválido para o serviço`);
        }
      }

      // Atualizar todos os serviços
      for (const update of updates) {
        const { error } = await supabase
          .from('services')
          .update({ price: update.price })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Todos os preços foram atualizados com sucesso"
      });

      await fetchServicesWithStats();

    } catch (error: any) {
      console.error("Erro ao atualizar preços:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar os preços",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }

  const totalZeroPriceAppointments = services.reduce(
    (total, service) => total + service.zero_price_appointments, 
    0
  );

  return (
    <PageContainer>
      <PageHeader
        title="Gerenciar Preços dos Serviços"
        description="Configure os preços padrão dos serviços e corrija agendamentos com valor zero"
      />

      <Tabs defaultValue="services" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="services" className="gap-2">
            <Settings className="h-4 w-4" />
            Preços dos Serviços
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2">
            <Wrench className="h-4 w-4" />
            Corrigir Agendamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-6">
          {/* Alertas de problemas */}
          {totalZeroPriceAppointments > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                  Atenção: Agendamentos com Preço Zero
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-700 mb-3">
                  Foram encontrados <strong>{totalZeroPriceAppointments} agendamentos</strong> com valor zero. 
                  Isso pode afetar o faturamento e relatórios financeiros.
                </p>
                <p className="text-sm text-amber-600">
                  Use a aba "Corrigir Agendamentos" para resolver esses problemas após definir os preços corretos.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Ações gerais */}
          <div className="flex justify-end gap-3">
            <Button 
              onClick={updateAllServicePrices}
              disabled={saving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar Todos os Preços"}
            </Button>
          </div>

          {/* Lista de serviços */}
          <div className="grid gap-4">
            {services.map((service) => {
              const hasZeroPriceAppointments = service.zero_price_appointments > 0;
              const currentPrice = parseFloat(priceInputs[service.id] || "0");
              const isZeroPrice = currentPrice === 0;

              return (
                <Card key={service.id} className={isZeroPrice ? "border-red-200" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {isZeroPrice && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Preço Zero
                          </Badge>
                        )}
                        {hasZeroPriceAppointments && (
                          <Badge variant="secondary">
                            {service.zero_price_appointments} agendamento(s) afetado(s)
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-1 block">
                          Preço Padrão (R$)
                        </label>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={priceInputs[service.id] || ""}
                            onChange={(e) => handlePriceChange(service.id, e.target.value)}
                            placeholder="0.00"
                            className={isZeroPrice ? "border-red-300" : ""}
                          />
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <div>Duração: {service.duration} minutos</div>
                        <div>Agendamentos: {service.appointments_count}</div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateServicePrice(service.id)}
                          disabled={currentPrice === service.price}
                        >
                          Atualizar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {services.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">Nenhum serviço encontrado</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="appointments">
          <ZeroPriceAppointmentsFixer onSuccess={fetchServicesWithStats} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default ServicesManagement;
