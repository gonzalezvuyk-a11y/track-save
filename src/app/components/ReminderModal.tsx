import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentReminder {
  id: string;
  title: string;
  dueDate: string;
  type: 'card-close' | 'card-due' | 'subscription' | 'other';
  amount?: number;
}

export function ReminderModal({ 
  isOpen, 
  onClose, 
  onSave
}: { 
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminder: Omit<PaymentReminder, 'id'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState<'card-close' | 'card-due' | 'subscription' | 'other'>('other');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) {
      toast.error('Completa título y fecha');
      return;
    }

    onSave({
      title,
      dueDate,
      type,
      amount: amount ? parseFloat(amount) : undefined,
    });

    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDueDate('');
      setType('other');
      setAmount('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-600" />
            <DialogTitle>Nuevo Recordatorio</DialogTitle>
          </div>
          <DialogDescription>
            Agrega un recordatorio de pago o vencimiento
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reminder-title">Título</Label>
            <Input
              id="reminder-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ej: Cierre Tarjeta Itaú"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder-date">Fecha de Vencimiento</Label>
            <Input
              id="reminder-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder-type">Tipo</Label>
            <Select value={type} onValueChange={(val: any) => setType(val)}>
              <SelectTrigger id="reminder-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card-close">Cierre de Tarjeta</SelectItem>
                <SelectItem value="card-due">Vencimiento de Tarjeta</SelectItem>
                <SelectItem value="subscription">Suscripción</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder-amount">Monto (opcional)</Label>
            <Input
              id="reminder-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Agregar Recordatorio
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
