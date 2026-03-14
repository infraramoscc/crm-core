import {
  AlertTriangle,
  ChartNoAxesCombined,
  CircleX,
  ClipboardClock,
  FileSearch,
  PhoneCall,
  Target,
  Trophy,
  UserPlus,
} from "lucide-react";
import { getDashboardSnapshot } from "@/app/actions/crm/dashboard-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function MetricCard({
  title,
  value,
  help,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string | number;
  help: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: string;
}) {
  return (
    <Card className={tone}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{help}</p>
      </CardContent>
    </Card>
  );
}

function formatMetricValue(value: number | null, suffix = "") {
  if (value === null) {
    return "-";
  }

  return `${value}${suffix}`;
}

export default async function DashboardPage() {
  const result = await getDashboardSnapshot();
  const dashboard = result.success && result.data ? result.data : null;

  if (!dashboard) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Comercial</h1>
          <p className="mt-2 text-muted-foreground">
            No se pudo construir el resumen comercial.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
          Dashboard Comercial
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Rentabilidad y Disciplina de Venta</h1>
        <p className="max-w-3xl text-muted-foreground">
          Lectura del dia: {dashboard.generatedAtLabel}. Este tablero no mide solo actividad; mide si tu tiempo esta produciendo oportunidades y donde se enfria el proceso comercial.
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Pulso Diario</h2>
          <p className="text-sm text-muted-foreground">Lo minimo para saber si hoy hubo movimiento real y si ese movimiento produjo captura comercial.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Contactos agregados hoy" value={dashboard.pulse.contactsToday} help="Nuevas personas cargadas al CRM hoy." icon={UserPlus} />
          <MetricCard title="Interacciones hoy" value={dashboard.pulse.interactionsToday} help="Intentos reales registrados en diario." icon={PhoneCall} />
          <MetricCard title="Oportunidades hoy" value={dashboard.pulse.opportunitiesToday} help="Negocios nuevos que pasaron a pipeline hoy." icon={Target} />
          <MetricCard title="Cotizaciones pedidas hoy" value={dashboard.pulse.quoteRequestsToday} help="La señal mas clara de caceria efectiva." icon={ChartNoAxesCombined} tone="border-emerald-200 bg-emerald-50/70" />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Conversion</h2>
          <p className="text-sm text-muted-foreground">Aqui no importa solo cuanto hiciste, sino que tanto de eso se movio hacia cierre o valor real.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Ganadas este mes" value={dashboard.conversion.wonMonth} help="Segun cambio de etapa a ganada en el mes actual." icon={Trophy} tone="border-emerald-200 bg-emerald-50/70" />
          <MetricCard title="Perdidas este mes" value={dashboard.conversion.lostMonth} help="Segun cambio de etapa a perdida en el mes actual." icon={CircleX} tone="border-rose-200 bg-rose-50/70" />
          <MetricCard title="Tasa cierre del mes" value={dashboard.conversion.winRateMonth !== null ? `${dashboard.conversion.winRateMonth}%` : "-"} help="Ganadas / (ganadas + perdidas)." icon={ChartNoAxesCombined} />
          <MetricCard title="Pipeline abierto" value={dashboard.conversion.openPipeline} help="Oportunidades activas por trabajar." icon={Target} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversion de interacciones hoy</CardTitle>
              <CardDescription>
                Si esta capa no sube, probablemente estas registrando esfuerzo sin suficiente avance real.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interaccion a pedido de cotizacion</p>
                <p className="mt-2 text-2xl font-bold">
                  {dashboard.conversion.interactionToQuoteRateToday !== null ? `${dashboard.conversion.interactionToQuoteRateToday}%` : "-"}
                </p>
              </div>
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interaccion a oportunidad</p>
                <p className="mt-2 text-2xl font-bold">
                  {dashboard.conversion.interactionToOpportunityRateToday !== null ? `${dashboard.conversion.interactionToOpportunityRateToday}%` : "-"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lectura del Dia</CardTitle>
              <CardDescription>
                Interpretacion directa para detectar donde se fuga tiempo o donde conviene presionar hoy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.focusReadout.map((item) => (
                <div key={item.title} className="rounded-xl border bg-muted/20 p-4">
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Fugas de Tiempo</CardTitle>
            <CardDescription>
              Aqui se concentra la perdida de rentabilidad comercial: seguimiento roto, investigacion incompleta o oportunidades avanzadas sin disciplina.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-amber-900">
                <ClipboardClock className="h-4 w-4" />
                <p className="font-semibold">Seguimientos vencidos</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-amber-950">{dashboard.leaks.overdueFollowUps}</p>
              <p className="mt-1 text-sm text-amber-900">El esfuerzo ya invertido se enfria si esto crece.</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-2 text-blue-900">
                <Target className="h-4 w-4" />
                <p className="font-semibold">Caceria sin siguiente paso</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-blue-950">{dashboard.leaks.prospectingWithoutNextStep}</p>
              <p className="mt-1 text-sm text-blue-900">Cuentas activas que pueden quedar flotando sin disciplina.</p>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <div className="flex items-center gap-2 text-violet-900">
                <FileSearch className="h-4 w-4" />
                <p className="font-semibold">Investigacion con contacto sin opinion</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-violet-950">{dashboard.leaks.investigationWithContactsNoOpinion}</p>
              <p className="mt-1 text-sm text-violet-900">Trabajo que ya encontro contacto, pero aun no genero criterio comercial.</p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-center gap-2 text-rose-900">
                <AlertTriangle className="h-4 w-4" />
                <p className="font-semibold">Negociacion sin referencia</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-rose-950">{dashboard.leaks.negotiatingWithoutQuoteRef}</p>
              <p className="mt-1 text-sm text-rose-900">Negocios avanzados sin trazabilidad completa de la cotizacion.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
              <div className="flex items-center gap-2 text-slate-900">
                <FileSearch className="h-4 w-4" />
                <p className="font-semibold">Investigacion trabada</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-950">{dashboard.leaks.investigationBlocked}</p>
              <p className="mt-1 text-sm text-slate-700">Cuentas bloqueadas o que requieren visita. Sirven para medir friccion de base y tiempo invertido sin salida rapida.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Motivos de Perdida</CardTitle>
            <CardDescription>
              La mejora comercial fuerte viene de entender por que se cae el negocio, no solo de abrir mas oportunidades.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.lossReasons.length === 0 ? (
              <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                Aun no hay perdidas registradas con motivo en el mes actual.
              </div>
            ) : (
              dashboard.lossReasons.map((item, index) => (
                <div key={`${item.reason}-${index}`} className="flex items-start justify-between gap-4 rounded-xl border bg-muted/20 p-4">
                  <div>
                    <p className="font-medium">{item.reason}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Este motivo esta drenando conversion en el mes actual.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{item.count}</p>
                    <p className="text-xs text-muted-foreground">caso(s)</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Aprendizaje del Ledger</h2>
          <p className="text-sm text-muted-foreground">
            Esta capa usa el historial de interacciones para mostrar que canal trae pedidos de cotizacion, cuanto esfuerzo estas necesitando antes de lograrlos y que patron aparece antes de ganar o perder.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Canales que mas convierten a cotizacion</CardTitle>
              <CardDescription>
                Lectura del mes actual. No solo muestra volumen, sino que canal esta logrando que el cliente pida cotizacion.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.ledgerLearning.channelPerformance.length === 0 ? (
                <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                  Aun no hay suficiente actividad externa en el mes actual para leer canales con criterio.
                </div>
              ) : (
                dashboard.ledgerLearning.channelPerformance.map((item) => (
                  <div key={item.channel} className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-[1.1fr_0.9fr]">
                    <div>
                      <p className="font-semibold">{item.channel}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.quoteRequests} pedido(s) de cotizacion sobre {item.interactions} interaccion(es) del canal.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:text-right">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cotizaciones</p>
                        <p className="mt-1 text-xl font-bold">{item.quoteRequests}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tasa</p>
                        <p className="mt-1 text-xl font-bold">{item.quoteRate}%</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Esfuerzo hasta primera cotizacion</CardTitle>
                <CardDescription>
                  Mide cuantos intentos externos necesitas antes del primer pedido de cotizacion del mes.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Empresas cotizadas</p>
                  <p className="mt-2 text-2xl font-bold">{dashboard.ledgerLearning.quoteEffort.quotedCompanies}</p>
                </div>
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Promedio intentos</p>
                  <p className="mt-2 text-2xl font-bold">{formatMetricValue(dashboard.ledgerLearning.quoteEffort.averageAttempts)}</p>
                </div>
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mediana intentos</p>
                  <p className="mt-2 text-2xl font-bold">{formatMetricValue(dashboard.ledgerLearning.quoteEffort.medianAttempts)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Patrones antes de cerrar</CardTitle>
                <CardDescription>
                  Lectura del mes actual sobre oportunidades cerradas para distinguir disciplina comercial de simple actividad.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <p className="font-semibold text-emerald-950">Ganadas</p>
                  <p className="mt-3 text-sm text-emerald-900">Promedio de interacciones ligadas: <span className="font-semibold">{formatMetricValue(dashboard.ledgerLearning.closureSignals.won.averageInteractions)}</span></p>
                  <p className="mt-1 text-sm text-emerald-900">Con reunion registrada: <span className="font-semibold">{formatMetricValue(dashboard.ledgerLearning.closureSignals.won.meetingRate, "%")}</span></p>
                  <p className="mt-1 text-sm text-emerald-900">Con referencia de cotizacion: <span className="font-semibold">{formatMetricValue(dashboard.ledgerLearning.closureSignals.won.quoteDisciplineRate, "%")}</span></p>
                  <p className="mt-1 text-sm text-emerald-900">Con senal de cotizacion o negociacion: <span className="font-semibold">{formatMetricValue(dashboard.ledgerLearning.closureSignals.won.negotiationSignalRate, "%")}</span></p>
                </div>

                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4">
                  <p className="font-semibold text-rose-950">Perdidas</p>
                  <p className="mt-3 text-sm text-rose-900">Promedio de interacciones ligadas: <span className="font-semibold">{formatMetricValue(dashboard.ledgerLearning.closureSignals.lost.averageInteractions)}</span></p>
                  <p className="mt-1 text-sm text-rose-900">Con reunion registrada: <span className="font-semibold">{formatMetricValue(dashboard.ledgerLearning.closureSignals.lost.meetingRate, "%")}</span></p>
                  <p className="mt-1 text-sm text-rose-900">Con referencia de cotizacion: <span className="font-semibold">{formatMetricValue(dashboard.ledgerLearning.closureSignals.lost.quoteDisciplineRate, "%")}</span></p>
                  <p className="mt-1 text-sm text-rose-900">Con senal de cotizacion o negociacion: <span className="font-semibold">{formatMetricValue(dashboard.ledgerLearning.closureSignals.lost.negotiationSignalRate, "%")}</span></p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
