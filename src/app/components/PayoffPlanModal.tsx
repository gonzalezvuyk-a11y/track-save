import { useMemo } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { formatCurrency } from '../lib/finance';

type Debt = {
  id: string;
  name: string;
  balance: number;
  apr?: number;
};

export function PayoffPlanModal({
  isOpen,
  onClose,
  debts,
  currency,
}: {
  isOpen: boolean;
  onClose: () => void;
  debts: Debt[];
  currency: string;
}) {
  const avalanche = useMemo(() => {
    return [...debts]
      .filter((d) => d.apr !== undefined)
      .sort((a, b) => (b.apr || 0) - (a.apr || 0));
  }, [debts]);

  const snowball = useMemo(() => {
    return [...debts].sort((a, b) => a.balance - b.balance);
  }, [debts]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Plan de Pago de Deudas</DialogTitle>
          <DialogDescription>Estrategias sugeridas para pagar tus deudas</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="avalanche" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="avalanche">Avalancha</TabsTrigger>
            <TabsTrigger value="snowball">Bola de nieve</TabsTrigger>
          </TabsList>

          <TabsContent value="avalanche" className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
              <strong>Método Avalancha:</strong> Prioriza deudas con mayor tasa de interés (APR).
              Minimiza el interés total pagado.
            </div>

            {avalanche.length === 0 ? (
              <p className="text-center text-neutral-500 py-8">No hay deudas con APR definido</p>
            ) : (
              <div className="space-y-2">
                <h4 className="font-semibold">Orden sugerido de pago:</h4>
                <ol className="space-y-2">
                  {avalanche.map((debt, index) => (
                    <li key={debt.id} className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{debt.name}</div>
                        <div className="text-sm text-neutral-600">
                          Balance: {formatCurrency(debt.balance, currency)} • APR: {debt.apr}%
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </TabsContent>

          <TabsContent value="snowball" className="space-y-4">
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-900">
              <strong>Método Bola de nieve:</strong> Prioriza deudas con menor balance.
              Genera victorias rápidas y motivación psicológica.
            </div>

            {snowball.length === 0 ? (
              <p className="text-center text-neutral-500 py-8">No hay deudas registradas</p>
            ) : (
              <div className="space-y-2">
                <h4 className="font-semibold">Orden sugerido de pago:</h4>
                <ol className="space-y-2">
                  {snowball.map((debt, index) => (
                    <li key={debt.id} className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{debt.name}</div>
                        <div className="text-sm text-neutral-600">
                          Balance: {formatCurrency(debt.balance, currency)}
                          {debt.apr && ` • APR: ${debt.apr}%`}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="rounded-lg bg-yellow-50 p-4 text-xs text-yellow-900">
          <strong>Nota:</strong> Estas son sugerencias educativas, no asesoría financiera.
          Consulta con un profesional para tu situación específica.
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
