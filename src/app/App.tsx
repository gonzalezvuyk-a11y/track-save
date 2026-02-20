import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Download, Upload, Search, Filter, Edit2, Trash2, 
  TrendingUp, TrendingDown, Wallet, PiggyBank, CreditCard,
  Copy, Calculator, DollarSign, BarChart as BarChartIcon,
  Target, Calendar, Zap, Tag, StickyNote, Check, X, Bell, AlertCircle,
  ShieldOff, ShieldCheck, Repeat, Clock, Ban, Play, Pause, Moon, Sun,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Badge } from './components/ui/badge';
import { Progress } from './components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Switch } from './components/ui/switch';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { WeeklyBudgetModal } from './components/WeeklyBudgetModal';
import { ReminderModal } from './components/ReminderModal';

// ===== TYPES =====
interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: string;
  type: 'Income' | 'Expense';
  account: 'Cash' | 'Bank' | 'Card';
  amount: number;
  tags?: string[];
  notes?: string;
}

interface Category {
  name: string;
  group: 'Fixed' | 'Variable' | 'Savings' | 'Debt';
  essential: boolean;
}

interface BudgetRow {
  id: string;
  month: string; // YYYY-MM
  category: string;
  budget: number;
}

interface Debt {
  id: string;
  name: string;
  balance: number;
  apr?: number;
  monthlyPayment: number;
  dueDay: number;
}

interface MonthlyGoal {
  id: string;
  month: string; // YYYY-MM
  savingsTarget: number;
  variableSpendingLimit: number;
  minimumDebtPayment: number;
}

interface CategoryRule {
  keyword: string;
  category: string;
}

interface CardDietMode {
  enabled: boolean;
  exceptions: string[]; // Categories that are allowed
  startDate: string; // When the diet started
}

interface Subscription {
  id: string;
  merchant: string;
  amount: number;
  category: string;
  lastCharge: string; // YYYY-MM-DD
  nextEstimated: string; // YYYY-MM-DD
  status: 'active' | 'paused' | 'cancelled';
}

interface WeeklyBudget {
  id: string;
  category: string;
  weeklyLimit: number;
  year: number;
  week: number; // ISO week number
}

interface PaymentReminder {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  type: 'card-close' | 'card-due' | 'subscription' | 'other';
  amount?: number;
}

// ===== DEFAULT DATA =====
const DEFAULT_CATEGORIES: Category[] = [
  { name: 'Renta', group: 'Fixed', essential: true },
  { name: 'Servicios', group: 'Fixed', essential: true },
  { name: 'Combustible', group: 'Fixed', essential: true },
  { name: 'Supermercado', group: 'Variable', essential: true },
  { name: 'Minimarket', group: 'Variable', essential: false },
  { name: 'Delivery', group: 'Variable', essential: false },
  { name: 'Transporte (Bolt/Uber)', group: 'Variable', essential: false },
  { name: 'Suscripciones', group: 'Variable', essential: false },
  { name: 'Salud', group: 'Variable', essential: true },
  { name: 'Restaurantes', group: 'Variable', essential: false },
  { name: 'Entretenimiento', group: 'Variable', essential: false },
  { name: 'Salario', group: 'Fixed', essential: true },
  { name: 'Freelance', group: 'Variable', essential: false },
  { name: 'Fondo de Emergencia', group: 'Savings', essential: true },
  { name: 'Inversión', group: 'Savings', essential: false },
  { name: 'Tarjeta de Crédito', group: 'Debt', essential: true },
  { name: 'Préstamo', group: 'Debt', essential: true },
];

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const shiftMonth = (month: string, delta: number) => {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, monthNumber - 1, 1);
  date.setMonth(date.getMonth() + delta);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const DEFAULT_BUDGETS = (month: string): BudgetRow[] => [
  { id: crypto.randomUUID(), month, category: 'Renta', budget: 0 },
  { id: crypto.randomUUID(), month, category: 'Servicios', budget: 0 },
  { id: crypto.randomUUID(), month, category: 'Supermercado', budget: 0 },
  { id: crypto.randomUUID(), month, category: 'Transporte', budget: 0 },
  { id: crypto.randomUUID(), month, category: 'Suscripciones', budget: 0 },
  { id: crypto.randomUUID(), month, category: 'Salud', budget: 0 },
  { id: crypto.randomUUID(), month, category: 'Restaurantes', budget: 0 },
  { id: crypto.randomUUID(), month, category: 'Fondo de Emergencia', budget: 0 },
  { id: crypto.randomUUID(), month, category: 'Inversión', budget: 0 },
];

const DEFAULT_DEBTS: Debt[] = [
  { id: crypto.randomUUID(), name: 'Tarjeta de Crédito', balance: 0, monthlyPayment: 0, dueDay: 10 },
  { id: crypto.randomUUID(), name: 'Préstamo', balance: 0, monthlyPayment: 0, dueDay: 25 },
];

// ===== UTILITY FUNCTIONS =====
const formatCurrency = (amount: number, currency: string = 'PYG') => {
  // PYG doesn't use decimal places
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
  };
  
  if (currency === 'PYG') {
    options.minimumFractionDigits = 0;
    options.maximumFractionDigits = 0;
  }
  
  return new Intl.NumberFormat('es-PY', options).format(amount);
};

const formatNumberWithDots = (value: number) => {
  if (!value) return '';
  return Math.trunc(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseNumberFromDots = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
};

// Get ISO week number
const getISOWeek = (date: Date): number => {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
};

// Get days without card usage
const getDaysWithoutCard = (transactions: Transaction[], cardDietStartDate: string): number => {
  const start = new Date(cardDietStartDate);
  const now = new Date();
  const cardTransactions = transactions.filter(t => 
    t.account === 'Card' && 
    t.type === 'Expense' && 
    new Date(t.date) >= start
  );
  
  if (cardTransactions.length === 0) {
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  const lastCardUse = new Date(Math.max(...cardTransactions.map(t => new Date(t.date).getTime())));
  return Math.floor((now.getTime() - lastCardUse.getTime()) / (1000 * 60 * 60 * 24));
};

// Detect subscriptions from transactions
const detectSubscriptions = (transactions: Transaction[]): Subscription[] => {
  const merchantGroups: { [key: string]: Transaction[] } = {};
  
  // Group by merchant (description)
  transactions
    .filter(t => t.type === 'Expense')
    .forEach(t => {
      const merchant = t.description.toUpperCase();
      if (!merchantGroups[merchant]) {
        merchantGroups[merchant] = [];
      }
      merchantGroups[merchant].push(t);
    });
  
  const subscriptions: Subscription[] = [];
  
  // Detect recurring patterns
  Object.entries(merchantGroups).forEach(([merchant, txns]) => {
    if (txns.length >= 2) {
      // Sort by date
      txns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Check if amounts are similar (within 10%)
      const avgAmount = txns.reduce((sum, t) => sum + t.amount, 0) / txns.length;
      const similarAmounts = txns.every(t => Math.abs(t.amount - avgAmount) / avgAmount < 0.1);
      
      if (similarAmounts) {
        const lastTxn = txns[txns.length - 1];
        const lastDate = new Date(lastTxn.date);
        const nextEstimated = new Date(lastDate);
        nextEstimated.setMonth(nextEstimated.getMonth() + 1);
        
        subscriptions.push({
          id: crypto.randomUUID(),
          merchant,
          amount: avgAmount,
          category: lastTxn.category,
          lastCharge: lastTxn.date,
          nextEstimated: nextEstimated.toISOString().split('T')[0],
          status: 'active',
        });
      }
    }
  });
  
  return subscriptions;
};

const getMonthFromDate = (date: string) => {
  return date.substring(0, 7); // YYYY-MM
};

// ===== MAIN APP =====
export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [debts, setDebts] = useState<Debt[]>(DEFAULT_DEBTS);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [customMonths, setCustomMonths] = useState<string[]>([]);
  const [currency, setCurrency] = useState('PYG');
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([]);
  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>(['Trabajo', 'Personal', 'Viaje', 'Familia']);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Behavioral features
  const [cardDietMode, setCardDietMode] = useState<CardDietMode>({
    enabled: false,
    exceptions: ['Servicios', 'Combustible'],
    startDate: new Date().toISOString().split('T')[0],
  });
  const [weeklyBudgets, setWeeklyBudgets] = useState<WeeklyBudget[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [paymentReminders, setPaymentReminders] = useState<PaymentReminder[]>([]);
  
  // Modal states
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isPayoffModalOpen, setIsPayoffModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isWeeklyBudgetModalOpen, setIsWeeklyBudgetModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingBudget, setEditingBudget] = useState<BudgetRow | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Load from localStorage on mount
  useEffect(() => {
    const savedTransactions = localStorage.getItem('finance-transactions');
    const savedCategories = localStorage.getItem('finance-categories');
    const savedBudgets = localStorage.getItem('finance-budgets');
    const savedDebts = localStorage.getItem('finance-debts');
    const savedCurrency = localStorage.getItem('finance-currency');
    const savedGoals = localStorage.getItem('finance-goals');
    const savedRules = localStorage.getItem('finance-rules');
    const savedTags = localStorage.getItem('finance-tags');
    const savedCardDiet = localStorage.getItem('finance-card-diet');
    const savedWeeklyBudgets = localStorage.getItem('finance-weekly-budgets');
    const savedSubscriptions = localStorage.getItem('finance-subscriptions');
    const savedReminders = localStorage.getItem('finance-reminders');
    const savedDarkMode = localStorage.getItem('finance-dark-mode');
    const savedCustomMonths = localStorage.getItem('finance-custom-months');

    if (savedDarkMode) setIsDarkMode(JSON.parse(savedDarkMode));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    if (savedCategories) setCategories(JSON.parse(savedCategories));
    if (savedBudgets) {
      setBudgets(JSON.parse(savedBudgets));
    } else {
      // Initialize with default budgets for current month
      setBudgets(DEFAULT_BUDGETS(getCurrentMonth()));
    }
    if (savedDebts) setDebts(JSON.parse(savedDebts));
    if (savedCurrency) setCurrency(savedCurrency);
    if (savedGoals) setMonthlyGoals(JSON.parse(savedGoals));
    if (savedRules) {
      setCategoryRules(JSON.parse(savedRules));
    } else {
      // Initialize default auto-categorization rules
      const defaultRules: CategoryRule[] = [
        { keyword: 'BOLT', category: 'Transporte (Bolt/Uber)' },
        { keyword: 'UBER', category: 'Transporte (Bolt/Uber)' },
        { keyword: 'PEDIDOSYA', category: 'Delivery' },
        { keyword: 'BIGGIE', category: 'Minimarket' },
        { keyword: 'RAPPI', category: 'Delivery' },
        { keyword: 'GLOVO', category: 'Delivery' },
        { keyword: 'DLOCAL*BOLT', category: 'Transporte (Bolt/Uber)' },
        { keyword: 'STOCK', category: 'Minimarket' },
        { keyword: 'COPETROL', category: 'Combustible' },
        { keyword: 'PETROBRAS', category: 'Combustible' },
        { keyword: 'NETFLIX', category: 'Suscripciones' },
        { keyword: 'SPOTIFY', category: 'Suscripciones' },
        { keyword: 'CHATGPT', category: 'Suscripciones' },
        { keyword: 'OPENAI', category: 'Suscripciones' },
        { keyword: 'CLAUDE', category: 'Suscripciones' },
      ];
      setCategoryRules(defaultRules);
    }
    if (savedTags) setAvailableTags(JSON.parse(savedTags));
    if (savedCardDiet) setCardDietMode(JSON.parse(savedCardDiet));
    if (savedWeeklyBudgets) setWeeklyBudgets(JSON.parse(savedWeeklyBudgets));
    if (savedSubscriptions) setSubscriptions(JSON.parse(savedSubscriptions));
    if (savedReminders) setPaymentReminders(JSON.parse(savedReminders));
    if (savedCustomMonths) setCustomMonths(JSON.parse(savedCustomMonths));
  }, []);

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('finance-dark-mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('finance-transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finance-categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('finance-budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('finance-debts', JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem('finance-currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('finance-goals', JSON.stringify(monthlyGoals));
  }, [monthlyGoals]);

  useEffect(() => {
    localStorage.setItem('finance-rules', JSON.stringify(categoryRules));
  }, [categoryRules]);

  useEffect(() => {
    localStorage.setItem('finance-tags', JSON.stringify(availableTags));
  }, [availableTags]);

  useEffect(() => {
    localStorage.setItem('finance-card-diet', JSON.stringify(cardDietMode));
  }, [cardDietMode]);

  useEffect(() => {
    localStorage.setItem('finance-weekly-budgets', JSON.stringify(weeklyBudgets));
  }, [weeklyBudgets]);

  useEffect(() => {
    localStorage.setItem('finance-subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem('finance-reminders', JSON.stringify(paymentReminders));
  }, [paymentReminders]);

  useEffect(() => {
    localStorage.setItem('finance-custom-months', JSON.stringify(customMonths));
  }, [customMonths]);

  // Auto-detect subscriptions when transactions change
  useEffect(() => {
    const detected = detectSubscriptions(transactions);
    setSubscriptions(detected);
  }, [transactions]);

  // Computed values
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => months.add(getMonthFromDate(t.date)));
    budgets.forEach(b => months.add(b.month));
    monthlyGoals.forEach(g => months.add(g.month));
    customMonths.forEach(month => months.add(month));
    // Always include current month
    months.add(getCurrentMonth());
    return Array.from(months).sort().reverse();
  }, [transactions, budgets, monthlyGoals, customMonths]);

  const ensureMonthAvailable = (month: string) => {
    setCustomMonths(prev => (prev.includes(month) ? prev : [...prev, month]));
  };

  const handleChangeMonth = (delta: number) => {
    const nextMonth = shiftMonth(selectedMonth, delta);
    ensureMonthAvailable(nextMonth);
    setSelectedMonth(nextMonth);
  };

  const handleAddNextMonth = () => {
    const nextMonth = shiftMonth(selectedMonth, 1);
    ensureMonthAvailable(nextMonth);
    setSelectedMonth(nextMonth);
    toast.success('Mes agregado');
  };

  const monthTransactions = useMemo(() => {
    return transactions.filter(t => getMonthFromDate(t.date) === selectedMonth);
  }, [transactions, selectedMonth]);

  const filteredTransactions = useMemo(() => {
    return monthTransactions.filter(t => {
      const matchesSearch = 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesAccount = filterAccount === 'all' || t.account === filterAccount;
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
      
      return matchesSearch && matchesType && matchesAccount && matchesCategory;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [monthTransactions, searchQuery, filterType, filterAccount, filterCategory]);

  const monthStats = useMemo(() => {
    const income = monthTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = monthTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const savingsCategories = categories
      .filter(c => c.group === 'Savings')
      .map(c => c.name);
    
    const savings = monthTransactions
      .filter(t => t.type === 'Expense' && savingsCategories.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const debtCategories = categories
      .filter(c => c.group === 'Debt')
      .map(c => c.name)
      .concat(debts.map(d => d.name));
    
    const debtPayments = monthTransactions
      .filter(t => t.type === 'Expense' && debtCategories.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expenses,
      balance: income - expenses,
      savings,
      debtPayments,
    };
  }, [monthTransactions, categories, debts]);

  // Monthly goal for current month
  const currentGoal = useMemo(() => {
    return monthlyGoals.find(g => g.month === selectedMonth) || null;
  }, [monthlyGoals, selectedMonth]);

  // Calculate "queda para gastar" (daily spending allowance)
  const dailyAllowance = useMemo(() => {
    const today = new Date();
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    const daysInMonth = monthEnd.getDate();
    const currentDay = today.getMonth() === month - 1 && today.getFullYear() === year 
      ? today.getDate() 
      : daysInMonth;
    const daysRemaining = Math.max(1, daysInMonth - currentDay + 1);

    // Essential expenses (categorías fijas)
    const essentialSpent = monthTransactions
      .filter(t => {
        const cat = categories.find(c => c.name === t.category);
        return t.type === 'Expense' && cat?.essential;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const plannedSavings = currentGoal?.savingsTarget || 0;
    const available = monthStats.income - essentialSpent - plannedSavings;
    const perDay = available / daysRemaining;

    return {
      available,
      perDay: Math.max(0, perDay),
      daysRemaining,
      essentialSpent,
    };
  }, [monthTransactions, monthStats.income, selectedMonth, currentGoal, categories]);

  // Auto insights
  const monthInsights = useMemo(() => {
    const insights: string[] = [];
    
    // Biggest variable expense
    const variableExpenses = monthTransactions
      .filter(t => {
        const cat = categories.find(c => c.name === t.category);
        return t.type === 'Expense' && cat?.group === 'Variable';
      });
    
    const categoryTotals = variableExpenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const maxCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    if (maxCategory) {
      insights.push(`Tu mayor gasto variable fue ${maxCategory[0]} (${formatCurrency(maxCategory[1], currency)})`);
    }

    // Savings rate
    if (monthStats.income > 0) {
      const savingsRate = ((monthStats.savings / monthStats.income) * 100).toFixed(1);
      insights.push(`Tu tasa de ahorro fue ${savingsRate}% del ingreso`);
    }

    // Balance status
    if (monthStats.balance > 0) {
      insights.push(`Terminaste el mes con ${formatCurrency(monthStats.balance, currency)} de superávit`);
    } else if (monthStats.balance < 0) {
      insights.push(`Hay un déficit de ${formatCurrency(Math.abs(monthStats.balance), currency)} este mes`);
    }

    return insights.slice(0, 3);
  }, [monthTransactions, monthStats, categories, currency]);

  const monthBudgets = useMemo(() => {
    return budgets.filter(b => b.month === selectedMonth);
  }, [budgets, selectedMonth]);

  const budgetStats = useMemo(() => {
    return monthBudgets.map(budget => {
      const spent = monthTransactions
        .filter(t => t.type === 'Expense' && t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const diff = budget.budget - spent;
      const percentUsed = budget.budget > 0 ? (spent / budget.budget) * 100 : 0;
      
      return {
        ...budget,
        spent,
        diff,
        percentUsed,
      };
    });
  }, [monthBudgets, monthTransactions]);

  // Next 7 days agenda (moved after budgetStats to avoid initialization error)
  const upcomingItems = useMemo(() => {
    const today = new Date();
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);
    
    const items: Array<{type: string; name: string; date: Date; amount?: number}> = [];

    // Debt due dates this month
    debts.forEach(debt => {
      const [year, month] = selectedMonth.split('-').map(Number);
      const dueDate = new Date(year, month - 1, debt.dueDay);
      if (dueDate >= today && dueDate <= next7Days) {
        items.push({
          type: 'debt',
          name: `Vencimiento: ${debt.name}`,
          date: dueDate,
          amount: debt.monthlyPayment,
        });
      }
    });

    // Budget warnings (>80% spent)
    budgetStats.forEach(stat => {
      if (stat.percentUsed > 80 && stat.percentUsed < 100) {
        items.push({
          type: 'budget',
          name: `Presupuesto ${stat.category} por cerrarse (${stat.percentUsed.toFixed(0)}%)`,
          date: today,
        });
      }
    });

    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [debts, selectedMonth, budgetStats]);

  const debtStats = useMemo(() => {
    return debts.map(debt => {
      const paidThisMonth = monthTransactions
        .filter(t => t.type === 'Expense' && t.category === debt.name)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const remaining = debt.monthlyPayment - paidThisMonth;
      
      return {
        ...debt,
        paidThisMonth,
        remaining,
      };
    });
  }, [debts, monthTransactions]);

  // Card diet mode stats
  const cardDietStats = useMemo(() => {
    if (!cardDietMode.enabled) return null;
    
    const daysWithoutCard = getDaysWithoutCard(transactions, cardDietMode.startDate);
    const cardViolations = transactions.filter(t =>
      t.account === 'Card' &&
      t.type === 'Expense' &&
      new Date(t.date) >= new Date(cardDietMode.startDate) &&
      !cardDietMode.exceptions.includes(t.category)
    );
    
    return {
      daysWithoutCard,
      violations: cardViolations.length,
      lastViolation: cardViolations.length > 0 ? cardViolations[cardViolations.length - 1] : null,
    };
  }, [cardDietMode, transactions]);

  // Weekly budget tracking
  const currentWeekStats = useMemo(() => {
    const now = new Date();
    const currentWeek = getISOWeek(now);
    const currentYear = now.getFullYear();
    
    // Get week start and end
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weekTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= weekStart && tDate <= weekEnd && t.type === 'Expense';
    });
    
    const categorySpending = weeklyBudgets.map(wb => {
      if (wb.week !== currentWeek || wb.year !== currentYear) return null;
      
      const spent = weekTransactions
        .filter(t => t.category === wb.category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        category: wb.category,
        limit: wb.weeklyLimit,
        spent,
        remaining: wb.weeklyLimit - spent,
        percentage: wb.weeklyLimit > 0 ? (spent / wb.weeklyLimit) * 100 : 0,
      };
    }).filter(Boolean);
    
    return categorySpending;
  }, [transactions, weeklyBudgets]);

  // Micro-spending analysis (< 50,000 Gs)
  const microSpendingStats = useMemo(() => {
    const microLimit = 50000; // Gs
    const microTransactions = monthTransactions.filter(
      t => t.type === 'Expense' && t.amount < microLimit
    );
    
    const totalMicroSpending = microTransactions.reduce((sum, t) => sum + t.amount, 0);
    const microCount = microTransactions.length;
    
    // Group by category
    const byCategory: { [key: string]: { count: number; total: number } } = {};
    microTransactions.forEach(t => {
      if (!byCategory[t.category]) {
        byCategory[t.category] = { count: 0, total: 0 };
      }
      byCategory[t.category].count++;
      byCategory[t.category].total += t.amount;
    });
    
    const topByCount = Object.entries(byCategory)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3);
    
    return {
      count: microCount,
      total: totalMicroSpending,
      topCategories: topByCount,
    };
  }, [monthTransactions]);

  // Upcoming payment reminders (next 7 days)
  const upcomingPayments = useMemo(() => {
    const now = new Date();
    const next7Days = new Date(now);
    next7Days.setDate(now.getDate() + 7);
    
    const upcoming = paymentReminders
      .filter(r => {
        const dueDate = new Date(r.dueDate);
        return dueDate >= now && dueDate <= next7Days;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    
    // Add subscription reminders
    subscriptions
      .filter(s => s.status === 'active')
      .forEach(sub => {
        const nextDate = new Date(sub.nextEstimated);
        if (nextDate >= now && nextDate <= next7Days) {
          upcoming.push({
            id: `sub-${sub.id}`,
            title: `Suscripción: ${sub.merchant}`,
            dueDate: sub.nextEstimated,
            type: 'subscription',
            amount: sub.amount,
          });
        }
      });
    
    return upcoming;
  }, [paymentReminders, subscriptions]);

  // ===== HANDLERS =====
  const handleAddTransaction = (transaction: Omit<Transaction, 'id'>) => {
    if (transaction.amount <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }
    if (!transaction.date) {
      toast.error('La fecha es requerida');
      return;
    }
    
    // Check Card Diet Mode violation
    if (
      cardDietMode.enabled && 
      transaction.account === 'Card' && 
      transaction.type === 'Expense' &&
      !cardDietMode.exceptions.includes(transaction.category)
    ) {
      toast.error('⚠️ ¡MODO DIETA TARJETA ACTIVO! Usaste tu tarjeta fuera de las excepciones', {
        duration: 5000,
      });
    }
    
    // Auto-create category if it doesn't exist
    if (!categories.find(c => c.name === transaction.category)) {
      const newCategory: Category = {
        name: transaction.category,
        group: 'Variable',
        essential: false,
      };
      setCategories([...categories, newCategory]);
      toast.info(`Categoría "${transaction.category}" creada automáticamente`);
    }
    
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
    };
    
    setTransactions([...transactions, newTransaction]);
    toast.success('Movimiento agregado');
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  };

  const handleUpdateTransaction = (id: string, updated: Omit<Transaction, 'id'>) => {
    if (updated.amount <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }
    
    setTransactions(transactions.map(t => 
      t.id === id ? { ...updated, id } : t
    ));
    toast.success('Movimiento actualizado');
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('¿Eliminar este movimiento?')) {
      setTransactions(transactions.filter(t => t.id !== id));
      toast.success('Movimiento eliminado');
    }
  };

  const handleAddBudget = (budget: Omit<BudgetRow, 'id'>) => {
    const newBudget: BudgetRow = {
      ...budget,
      id: crypto.randomUUID(),
    };
    setBudgets([...budgets, newBudget]);
    toast.success('Presupuesto agregado');
    setIsBudgetModalOpen(false);
    setEditingBudget(null);
  };

  const handleUpdateBudget = (id: string, updated: Omit<BudgetRow, 'id'>) => {
    setBudgets(budgets.map(b => 
      b.id === id ? { ...updated, id } : b
    ));
    toast.success('Presupuesto actualizado');
    setIsBudgetModalOpen(false);
    setEditingBudget(null);
  };

  const handleDeleteBudget = (id: string) => {
    if (confirm('¿Eliminar este presupuesto?')) {
      setBudgets(budgets.filter(b => b.id !== id));
      toast.success('Presupuesto eliminado');
    }
  };

  const handleCopyBudgetsFromPreviousMonth = () => {
    const monthDate = new Date(selectedMonth + '-01');
    monthDate.setMonth(monthDate.getMonth() - 1);
    const previousMonth = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    
    const previousBudgets = budgets.filter(b => b.month === previousMonth);
    
    if (previousBudgets.length === 0) {
      toast.error('No hay presupuestos en el mes anterior');
      return;
    }
    
    const newBudgets = previousBudgets.map(b => ({
      ...b,
      id: crypto.randomUUID(),
      month: selectedMonth,
    }));
    
    setBudgets([...budgets, ...newBudgets]);
    toast.success(`${newBudgets.length} presupuestos copiados`);
  };

  const handleAddDebt = (debt: Omit<Debt, 'id'>) => {
    const newDebt: Debt = {
      ...debt,
      id: crypto.randomUUID(),
    };
    setDebts([...debts, newDebt]);
    toast.success('Deuda agregada');
    setIsDebtModalOpen(false);
    setEditingDebt(null);
  };

  const handleUpdateDebt = (id: string, updated: Omit<Debt, 'id'>) => {
    setDebts(debts.map(d => 
      d.id === id ? { ...updated, id } : d
    ));
    toast.success('Deuda actualizada');
    setIsDebtModalOpen(false);
    setEditingDebt(null);
  };

  const handleDeleteDebt = (id: string) => {
    if (confirm('¿Eliminar esta deuda?')) {
      setDebts(debts.filter(d => d.id !== id));
      toast.success('Deuda eliminada');
    }
  };

  const handleSaveGoal = (goal: Omit<MonthlyGoal, 'id'>) => {
    const existing = monthlyGoals.find(g => g.month === selectedMonth);
    if (existing) {
      setMonthlyGoals(monthlyGoals.map(g => 
        g.month === selectedMonth ? { ...goal, id: existing.id } : g
      ));
      toast.success('Meta actualizada');
    } else {
      const newGoal: MonthlyGoal = {
        ...goal,
        id: crypto.randomUUID(),
        month: selectedMonth,
      };
      setMonthlyGoals([...monthlyGoals, newGoal]);
      toast.success('Meta creada');
    }
    setIsGoalModalOpen(false);
  };

  const handleSuggestCategory = (description: string): string | null => {
    const lowerDesc = description.toLowerCase();
    for (const rule of categoryRules) {
      if (lowerDesc.includes(rule.keyword.toLowerCase())) {
        return rule.category;
      }
    }
    return null;
  };

  const handleSaveRule = (keyword: string, category: string) => {
    const existing = categoryRules.find(r => r.keyword.toLowerCase() === keyword.toLowerCase());
    if (!existing) {
      setCategoryRules([...categoryRules, { keyword, category }]);
      toast.success(`Regla guardada: "${keyword}" → ${category}`);
    }
  };

  const handleExportCSV = () => {
    const headers = ['date', 'description', 'category', 'type', 'account', 'amount', 'notes', 'tags'];
    const rows = transactions.map(t => [
      t.date,
      t.description,
      t.category,
      t.type,
      t.account,
      t.amount.toString(),
      t.notes || '',
      (t.tags || []).join('|'),
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    
    toast.success('CSV exportado');
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      let imported = 0;
      let errors = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',');
        
        try {
          const transaction: Transaction = {
            id: crypto.randomUUID(),
            date: values[0],
            description: values[1],
            category: values[2],
            type: values[3] as 'Income' | 'Expense',
            account: values[4] as 'Cash' | 'Bank' | 'Card',
            amount: parseFloat(values[5]),
            notes: values[6] || '',
            tags: values[7] ? values[7].split('|').filter(Boolean) : [],
          };
          
          if (transaction.amount > 0 && transaction.date) {
            setTransactions(prev => [...prev, transaction]);
            imported++;
          } else {
            errors++;
          }
        } catch {
          errors++;
        }
      }
      
      if (imported > 0) {
        toast.success(`${imported} movimientos importados`);
      }
      if (errors > 0) {
        toast.error(`${errors} filas con errores`);
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const chartData = [
    {
      name: 'Mes',
      Ingresos: monthStats.income,
      Gastos: monthStats.expenses,
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 transition-colors duration-300">
      <Toaster />
      
      {/* Top Bar - Apple Style */}
      <div className="max-w-[1440px] mx-auto mb-8">
        <div className="glass-card rounded-3xl shadow-2xl shadow-black/5 border border-border/50 p-8 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">track&save</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Gestiona tus finanzas inteligentemente</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Dark Mode Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="rounded-full w-11 h-11 border-border/50 hover:border-primary/50 hover:bg-accent/50 transition-all"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-700" />
                )}
              </Button>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleChangeMonth(-1)}
                  className="rounded-full w-11 h-11 border-border/50 hover:border-primary/50 hover:bg-accent/50 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[180px] rounded-xl border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {availableMonths.map(month => (
                    <SelectItem key={month} value={month} className="rounded-lg">
                      {new Date(month + '-01').toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleChangeMonth(1)}
                  className="rounded-full w-11 h-11 border-border/50 hover:border-primary/50 hover:bg-accent/50 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAddNextMonth}
                  className="rounded-xl border-border/50 hover:border-primary/50 hover:bg-accent/50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar mes
                </Button>
              </div>
              
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-[120px] rounded-xl border-border/50">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="PYG" className="rounded-lg">PYG (₲)</SelectItem>
                  <SelectItem value="USD" className="rounded-lg">USD ($)</SelectItem>
                  <SelectItem value="EUR" className="rounded-lg">EUR (€)</SelectItem>
                  <SelectItem value="MXN" className="rounded-lg">MXN ($)</SelectItem>
                  <SelectItem value="ARS" className="rounded-lg">ARS ($)</SelectItem>
                  <SelectItem value="COP" className="rounded-lg">COP ($)</SelectItem>
                  <SelectItem value="CLP" className="rounded-lg">CLP ($)</SelectItem>
                  <SelectItem value="PEN" className="rounded-lg">PEN (S/)</SelectItem>
                  <SelectItem value="GBP" className="rounded-lg">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Card Diet Mode Toggle */}
              <div className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl border border-border/50 shadow-sm">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={cardDietMode.enabled}
                    onCheckedChange={(checked) => {
                      setCardDietMode({
                        ...cardDietMode,
                        enabled: checked,
                        startDate: checked ? new Date().toISOString().split('T')[0] : cardDietMode.startDate,
                      });
                      toast.success(checked ? 'Modo Tarjeta en Dieta activado' : 'Modo Tarjeta en Dieta desactivado');
                    }}
                  />
                  <Label htmlFor="card-diet" className="text-sm cursor-pointer flex items-center gap-1.5 font-medium">
                    {cardDietMode.enabled ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                    )}
                    Dieta Tarjeta
                  </Label>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => setIsQuickAddOpen(true)} className="rounded-xl bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/25 transition-all">
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Add
                </Button>
                <Button onClick={() => setIsTransactionModalOpen(true)} variant="outline" className="rounded-xl border-border/50 hover:border-primary/50">
                  <Plus className="w-4 h-4 mr-2" />
                  Completo
                </Button>
              </div>
              
              <Button onClick={() => setIsBudgetModalOpen(true)} variant="outline" className="rounded-xl border-border/50 hover:border-primary/50">
                <Plus className="w-4 h-4 mr-2" />
                Presupuesto
              </Button>
              
              <Button onClick={() => setIsDebtModalOpen(true)} variant="outline" className="rounded-xl border-border/50 hover:border-primary/50">
                <Plus className="w-4 h-4 mr-2" />
                Deuda
              </Button>
              
              <Button onClick={handleExportCSV} variant="outline" className="rounded-xl border-border/50 hover:border-primary/50">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              
              <label>
                <Button variant="outline" asChild className="rounded-xl border-border/50 hover:border-primary/50">
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Modo Tarjeta en Dieta - Apple Style */}
      {cardDietMode.enabled && cardDietStats && (
        <div className="max-w-[1440px] mx-auto mb-8">
          <Card className={`glass-card rounded-3xl shadow-2xl backdrop-blur-xl border-2 transition-all ${
            cardDietStats.violations === 0 
              ? 'bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/30 shadow-emerald-500/10' 
              : 'bg-gradient-to-br from-rose-500/10 to-transparent border-rose-500/30 shadow-rose-500/10'
          }`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                    cardDietStats.violations === 0 
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25' 
                      : 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-500/25'
                  }`}>
                    {cardDietStats.violations === 0 ? (
                      <ShieldCheck className="w-7 h-7 text-white" />
                    ) : (
                      <ShieldOff className="w-7 h-7 text-white" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-xl tracking-tight">Modo Tarjeta en Dieta</CardTitle>
                    <CardDescription className="text-base mt-1">
                      {cardDietStats.violations === 0 
                        ? '¡Vas bien! Sin infracciones' 
                        : `${cardDietStats.violations} gasto${cardDietStats.violations > 1 ? 's' : ''} con tarjeta detectado${cardDietStats.violations > 1 ? 's' : ''}`
                      }
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold tracking-tight">
                    {cardDietStats.daysWithoutCard}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    día{cardDietStats.daysWithoutCard !== 1 ? 's' : ''} sin tarjeta
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">Excepciones permitidas:</span>
                {cardDietMode.exceptions.map(exc => (
                  <Badge key={exc} variant="outline" className="text-xs rounded-full border-border/50">
                    {exc}
                  </Badge>
                ))}
              </div>
              {cardDietStats.lastViolation && (
                <div className="mt-4 p-4 glass rounded-2xl border border-rose-500/30 bg-rose-500/10">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <span>
                      Última infracción: {cardDietStats.lastViolation.description} - 
                      {formatCurrency(cardDietStats.lastViolation.amount, currency)} 
                      ({new Date(cardDietStats.lastViolation.date).toLocaleDateString('es-ES')})
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Presupuestos Semanales & Alertas */}
      {currentWeekStats && currentWeekStats.length > 0 && (
        <div className="max-w-[1440px] mx-auto mb-8">
          <Card className="rounded-2xl shadow-sm border-neutral-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">Presupuestos Semanales</CardTitle>
              </div>
              <CardDescription>
                Gasto semanal en categorías trampa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentWeekStats.map((stat: any) => (
                <div key={stat.category} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{stat.category}</span>
                    <span className={stat.remaining < 0 ? 'text-rose-600 font-semibold' : 'text-neutral-600'}>
                      {formatCurrency(stat.spent, currency)} / {formatCurrency(stat.limit, currency)}
                    </span>
                  </div>
                  <Progress value={Math.min(stat.percentage, 100)} className="h-2" />
                  <div className="text-xs text-neutral-500">
                    {stat.remaining >= 0 ? (
                      <>Te quedan {formatCurrency(stat.remaining, currency)} esta semana</>
                    ) : (
                      <span className="text-rose-600 font-medium">
                        ¡Excediste en {formatCurrency(Math.abs(stat.remaining), currency)}!
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Micro-gastos Alert */}
      {microSpendingStats.count > 20 && (
        <div className="max-w-[1440px] mx-auto mb-8">
          <Card className="rounded-2xl shadow-sm border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600" />
                <div>
                  <CardTitle className="text-lg">Top Fugas Detectadas</CardTitle>
                  <CardDescription>
                    Este mes hiciste {microSpendingStats.count} compras &lt; 50.000 Gs
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total micro-gastos:</span>
                  <span className="text-lg font-bold text-amber-900">
                    {formatCurrency(microSpendingStats.total, currency)}
                  </span>
                </div>
                <div className="border-t border-amber-200 pt-3">
                  <div className="text-xs font-medium text-neutral-600 mb-2">Top categorías:</div>
                  {microSpendingStats.topCategories.map(([category, data]: any) => (
                    <div key={category} className="flex justify-between text-sm py-1">
                      <span>{category}</span>
                      <span className="text-neutral-600">
                        {data.count}x - {formatCurrency(data.total, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calendario de Próximos Vencimientos */}
      {upcomingPayments.length > 0 && (
        <div className="max-w-[1440px] mx-auto mb-8">
          <Card className="rounded-2xl shadow-sm border-neutral-200 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-lg">Próximos 7 Días</CardTitle>
              </div>
              <CardDescription>
                Vencimientos y suscripciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingPayments.map(payment => (
                  <div 
                    key={payment.id} 
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-200"
                  >
                    <div className="flex items-center gap-3">
                      {payment.type === 'subscription' && <Repeat className="w-4 h-4 text-purple-600" />}
                      {payment.type === 'card-close' && <CreditCard className="w-4 h-4 text-blue-600" />}
                      {payment.type === 'card-due' && <Clock className="w-4 h-4 text-rose-600" />}
                      {payment.type === 'other' && <Bell className="w-4 h-4 text-neutral-600" />}
                      <div>
                        <div className="text-sm font-medium">{payment.title}</div>
                        <div className="text-xs text-neutral-500">
                          {new Date(payment.dueDate).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </div>
                      </div>
                    </div>
                    {payment.amount && (
                      <div className="text-sm font-semibold">
                        {formatCurrency(payment.amount, currency)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Suscripciones Detectadas */}
      {subscriptions.length > 0 && (
        <div className="max-w-[1440px] mx-auto mb-8">
          <Card className="rounded-2xl shadow-sm border-neutral-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-indigo-600" />
                  <CardTitle className="text-lg">Suscripciones Detectadas</CardTitle>
                </div>
                <div className="text-sm text-neutral-600">
                  Total: {formatCurrency(
                    subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.amount, 0),
                    currency
                  )}/mes
                </div>
              </div>
              <CardDescription>
                Cargos recurrentes automáticamente detectados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {subscriptions.map(sub => (
                  <div 
                    key={sub.id} 
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      sub.status === 'active' 
                        ? 'bg-white border-neutral-200' 
                        : 'bg-neutral-50 border-neutral-300 opacity-60'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{sub.merchant}</span>
                        <Badge 
                          variant={sub.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {sub.status === 'active' ? 'Activa' : 
                           sub.status === 'paused' ? 'Pausada' : 'Cancelada'}
                        </Badge>
                      </div>
                      <div className="text-xs text-neutral-500">
                        {sub.category} • Próximo cargo: {new Date(sub.nextEstimated).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(sub.amount, currency)}
                        </div>
                        <div className="text-xs text-neutral-500">mensual</div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const updated = subscriptions.map(s =>
                              s.id === sub.id
                                ? { ...s, status: s.status === 'active' ? 'paused' : 'active' as any }
                                : s
                            );
                            setSubscriptions(updated);
                            toast.success(sub.status === 'active' ? 'Suscripción pausada' : 'Suscripción activada');
                          }}
                        >
                          {sub.status === 'active' ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const updated = subscriptions.map(s =>
                              s.id === sub.id ? { ...s, status: 'cancelled' as any } : s
                            );
                            setSubscriptions(updated);
                            toast.success('Suscripción marcada como cancelada');
                          }}
                        >
                          <Ban className="w-4 h-4 text-rose-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plan del Mes */}
      <div className="max-w-[1440px] mx-auto mb-8">
        <Card className="rounded-2xl shadow-sm border-neutral-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">Plan del Mes</CardTitle>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsGoalModalOpen(true)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                {currentGoal ? 'Editar' : 'Configurar'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {currentGoal ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Meta de ahorro */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <PiggyBank className="w-4 h-4 text-violet-600" />
                    Meta de ahorro
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-semibold text-violet-700">
                        {formatCurrency(monthStats.savings, currency)}
                      </span>
                      <span className="text-sm text-neutral-500">
                        de {formatCurrency(currentGoal.savingsTarget, currency)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <Progress 
                        value={Math.min((monthStats.savings / currentGoal.savingsTarget) * 100, 100)} 
                        className="h-2"
                      />
                      <div className="text-xs text-neutral-500">
                        {((monthStats.savings / currentGoal.savingsTarget) * 100).toFixed(0)}% completado
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tope de gasto variable */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    Tope de gasto variable
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-semibold text-rose-700">
                        {formatCurrency(monthTransactions
                          .filter(t => {
                            const cat = categories.find(c => c.name === t.category);
                            return t.type === 'Expense' && cat?.group === 'Variable';
                          })
                          .reduce((sum, t) => sum + t.amount, 0), currency)}
                      </span>
                      <span className="text-sm text-neutral-500">
                        de {formatCurrency(currentGoal.variableSpendingLimit, currency)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <Progress 
                        value={Math.min((monthTransactions
                          .filter(t => {
                            const cat = categories.find(c => c.name === t.category);
                            return t.type === 'Expense' && cat?.group === 'Variable';
                          })
                          .reduce((sum, t) => sum + t.amount, 0) / currentGoal.variableSpendingLimit) * 100, 100)} 
                        className="h-2"
                      />
                      <div className="text-xs text-emerald-600 font-medium">
                        Quedan {formatCurrency(Math.max(0, currentGoal.variableSpendingLimit - monthTransactions
                          .filter(t => {
                            const cat = categories.find(c => c.name === t.category);
                            return t.type === 'Expense' && cat?.group === 'Variable';
                          })
                          .reduce((sum, t) => sum + t.amount, 0)), currency)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pago mínimo de deudas */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <CreditCard className="w-4 h-4 text-orange-600" />
                    Pago mínimo de deudas
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-semibold text-orange-700">
                        {formatCurrency(monthStats.debtPayments, currency)}
                      </span>
                      <span className="text-sm text-neutral-500">
                        de {formatCurrency(currentGoal.minimumDebtPayment, currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {monthStats.debtPayments >= currentGoal.minimumDebtPayment ? (
                        <>
                          <Check className="w-5 h-5 text-emerald-600" />
                          <span className="text-sm text-emerald-600 font-medium">Completado</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-amber-600" />
                          <span className="text-sm text-amber-600 font-medium">
                            Faltan {formatCurrency(currentGoal.minimumDebtPayment - monthStats.debtPayments, currency)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="mb-4">Configurá tus metas para este mes</p>
                <Button onClick={() => setIsGoalModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear plan del mes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN */}
        <div className="space-y-8">
          {/* Dashboard Card - Apple Style */}
          <Card className="glass-card rounded-3xl shadow-2xl shadow-black/5 border-border/50 backdrop-blur-xl">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <BarChartIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl tracking-tight">Resumen del Mes</CardTitle>
                  <CardDescription className="text-base mt-0.5">
                    {new Date(selectedMonth + '-01').toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Main Balance - Hero KPI */}
              <div className="text-center py-8 glass rounded-3xl border border-border/30">
                <div className="text-sm text-muted-foreground mb-3 font-medium tracking-wide uppercase">Saldo del mes</div>
                <div className={`text-6xl font-bold mb-2 tracking-tight ${
                  monthStats.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {formatCurrency(monthStats.balance, currency)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {monthStats.balance >= 0 ? 'Superávit' : 'Déficit'}
                </div>
              </div>

              {/* Secondary KPIs */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 p-4 glass rounded-2xl border border-border/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    Ingresos
                  </div>
                  <div className="text-xl font-bold text-emerald-500 tracking-tight">
                    {formatCurrency(monthStats.income, currency)}
                  </div>
                </div>
                
                <div className="space-y-2 p-4 glass rounded-2xl border border-border/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center">
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                    </div>
                    Gastos
                  </div>
                  <div className="text-xl font-bold text-rose-500 tracking-tight">
                    {formatCurrency(monthStats.expenses, currency)}
                  </div>
                </div>
                
                <div className="space-y-2 p-4 glass rounded-2xl border border-border/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <PiggyBank className="w-4 h-4 text-purple-500" />
                    </div>
                    Ahorro
                  </div>
                  <div className="text-xl font-bold text-purple-500 tracking-tight">
                    {formatCurrency(monthStats.savings, currency)}
                  </div>
                </div>
              </div>
              
              {/* Chart or Empty State */}
              {monthStats.income === 0 && monthStats.expenses === 0 ? (
                <div className="h-[200px] w-full flex flex-col items-center justify-center glass rounded-3xl border-2 border-dashed border-border/50">
                  <div className="text-muted-foreground mb-2">
                    <BarChartIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Sin datos aún</p>
                  <p className="text-xs text-muted-foreground mt-1">Agregá movimientos para ver el análisis</p>
                </div>
              ) : (
                <div className="h-[200px] w-full p-4 glass rounded-3xl border border-border/30">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                      <XAxis dataKey="name" stroke="currentColor" opacity={0.5} />
                      <YAxis stroke="currentColor" opacity={0.5} />
                      <Tooltip 
                        formatter={(value) => formatCurrency(Number(value), currency)}
                        contentStyle={{ 
                          backgroundColor: 'var(--popover)',
                          border: '1px solid var(--border)',
                          borderRadius: '1rem',
                          backdropFilter: 'blur(20px)'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Ingresos" fill="#059669" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="Gastos" fill="#e11d48" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Queda para gastar */}
              {currentGoal && dailyAllowance.perDay > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Wallet className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-blue-900 mb-1">
                        Disponible para gastar
                      </div>
                      <div className="text-2xl font-semibold text-blue-700 mb-1">
                        {formatCurrency(dailyAllowance.perDay, currency)}/día
                      </div>
                      <div className="text-xs text-blue-600">
                        {dailyAllowance.daysRemaining} días restantes del mes • {formatCurrency(dailyAllowance.available, currency)} total disponible
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Insights rápidos */}
              {monthInsights.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Análisis rápido
                  </div>
                  <div className="space-y-2">
                    {monthInsights.map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Próximos 7 días */}
          {upcomingItems.length > 0 && (
            <Card className="rounded-2xl shadow-sm border-neutral-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-600" />
                  <CardTitle>Próximos 7 días</CardTitle>
                </div>
                <CardDescription>Recordatorios y vencimientos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      {item.type === 'debt' ? (
                        <CreditCard className="w-5 h-5 text-orange-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-neutral-900">{item.name}</div>
                        <div className="text-xs text-neutral-600">
                          {item.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          {item.amount && ` • ${formatCurrency(item.amount, currency)}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transactions Table */}
          <Card className="rounded-2xl shadow-sm border-neutral-200">
            <CardHeader>
              <CardTitle>Movimientos</CardTitle>
              <CardDescription>
                {filteredTransactions.length} de {monthTransactions.length} movimientos
              </CardDescription>
              
              <div className="flex flex-col md:flex-row gap-3 pt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    placeholder="Buscar…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-[140px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Income">Ingresos</SelectItem>
                    <SelectItem value="Expense">Gastos</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterAccount} onValueChange={setFilterAccount}>
                  <SelectTrigger className="w-full md:w-[140px]">
                    <SelectValue placeholder="Cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="Cash">Efectivo</SelectItem>
                    <SelectItem value="Bank">Banco</SelectItem>
                    <SelectItem value="Card">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full md:w-[140px]">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.name} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <p className="mb-4">No hay movimientos para mostrar</p>
                  <Button onClick={() => setIsTransactionModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar tu primer movimiento
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Cuenta</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map(transaction => (
                        <TableRow key={transaction.id} className="group">
                          <TableCell className="font-medium">
                            {new Date(transaction.date).toLocaleDateString('es-ES')}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div>{transaction.description}</div>
                              {transaction.tags && transaction.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {transaction.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {transaction.notes && (
                                <div className="flex items-center gap-1 text-xs text-neutral-500">
                                  <StickyNote className="w-3 h-3" />
                                  {transaction.notes}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{transaction.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={transaction.type === 'Income' ? 'default' : 'secondary'}>
                              {transaction.type === 'Income' ? 'Ingreso' : 'Gasto'}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.account}</TableCell>
                          <TableCell className={`text-right font-semibold ${
                            transaction.type === 'Income' ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {formatCurrency(transaction.amount, currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingTransaction(transaction);
                                  setIsTransactionModalOpen(true);
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteTransaction(transaction.id)}
                              >
                                <Trash2 className="w-4 h-4 text-rose-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8">
          {/* Budget vs Spent */}
          <Card className="rounded-2xl shadow-sm border-neutral-200">
            <CardHeader>
              <CardTitle>Presupuesto vs Gastado</CardTitle>
              <CardDescription>Seguimiento mensual de categorías</CardDescription>
              
              <div className="pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyBudgetsFromPreviousMonth}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar presupuestos del mes anterior
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {budgetStats.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <p className="mb-4">No hay presupuestos configurados</p>
                  <Button onClick={() => setIsBudgetModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar tu primer presupuesto
                  </Button>
                </div>
              ) : (
                <>
                  {budgetStats.every(b => b.budget === 0) && (
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm text-amber-800">
                        💡 <strong>Cargá tus presupuestos</strong> para comenzar a trackear tus gastos por categoría
                      </p>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-right">Presupuesto</TableHead>
                        <TableHead className="text-right">Gastado</TableHead>
                        <TableHead className="text-right">Diferencia</TableHead>
                        <TableHead>% Usado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {budgetStats.map(stat => (
                        <TableRow key={stat.id} className="group">
                          <TableCell className="font-medium">{stat.category}</TableCell>
                          <TableCell className="text-right text-neutral-700">
                            {stat.budget === 0 ? '—' : formatCurrency(stat.budget, currency)}
                          </TableCell>
                          <TableCell className="text-right text-neutral-700">
                            {stat.spent === 0 ? '—' : formatCurrency(stat.spent, currency)}
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${
                            stat.budget === 0 ? 'text-neutral-400' : 
                            stat.diff >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {stat.budget === 0 ? '—' : formatCurrency(stat.diff, currency)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Progress 
                                value={Math.min(stat.percentUsed, 100)} 
                                className="h-2"
                              />
                              <div className="text-xs text-neutral-500">
                                {stat.percentUsed.toFixed(0)}%
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingBudget(stat);
                                  setIsBudgetModalOpen(true);
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteBudget(stat.id)}
                              >
                                <Trash2 className="w-4 h-4 text-rose-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Debts Table */}
          <Card className="rounded-2xl shadow-sm border-neutral-200">
            <CardHeader>
              <CardTitle>Deudas</CardTitle>
              <CardDescription>Seguimiento y pagos mensuales</CardDescription>
              
              <div className="pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPayoffModalOpen(true)}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Planificar pago de deudas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {debtStats.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <p className="mb-4">No hay deudas registradas</p>
                  <Button onClick={() => setIsDebtModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar deuda
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">Pago mensual</TableHead>
                        <TableHead className="text-right">Día de vencimiento</TableHead>
                        <TableHead className="text-right">Pagado este mes</TableHead>
                        <TableHead className="text-right">Pendiente</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {debtStats.map(debt => (
                        <TableRow key={debt.id} className="group">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-neutral-400" />
                              {debt.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-neutral-700">
                            {debt.balance === 0 ? '—' : formatCurrency(debt.balance, currency)}
                          </TableCell>
                          <TableCell className="text-right text-neutral-700">
                            {debt.monthlyPayment === 0 ? '—' : formatCurrency(debt.monthlyPayment, currency)}
                          </TableCell>
                          <TableCell className="text-right text-neutral-600">
                            Día {debt.dueDay}
                          </TableCell>
                          <TableCell className="text-right text-emerald-700 font-semibold">
                            {debt.paidThisMonth === 0 ? '—' : formatCurrency(debt.paidThisMonth, currency)}
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${
                            debt.remaining > 0 ? 'text-rose-700' : 'text-emerald-700'
                          }`}>
                            {debt.remaining === 0 ? '—' : formatCurrency(Math.max(0, debt.remaining), currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingDebt(debt);
                                  setIsDebtModalOpen(true);
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteDebt(debt.id)}
                              >
                                <Trash2 className="w-4 h-4 text-rose-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={editingTransaction 
          ? (t) => handleUpdateTransaction(editingTransaction.id, t)
          : handleAddTransaction
        }
        categories={categories}
        transaction={editingTransaction}
        availableTags={availableTags}
        onAddTag={(tag) => {
          if (!availableTags.includes(tag)) {
            setAvailableTags([...availableTags, tag]);
          }
        }}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => {
          setIsBudgetModalOpen(false);
          setEditingBudget(null);
        }}
        onSave={editingBudget
          ? (b) => handleUpdateBudget(editingBudget.id, b)
          : handleAddBudget
        }
        categories={categories}
        selectedMonth={selectedMonth}
        budget={editingBudget}
      />

      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => {
          setIsDebtModalOpen(false);
          setEditingDebt(null);
        }}
        onSave={editingDebt
          ? (d) => handleUpdateDebt(editingDebt.id, d)
          : handleAddDebt
        }
        debt={editingDebt}
      />

      <PayoffPlanModal
        isOpen={isPayoffModalOpen}
        onClose={() => setIsPayoffModalOpen(false)}
        debts={debts}
        currency={currency}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={handleSaveGoal}
        goal={currentGoal}
        currency={currency}
      />

      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSave={handleAddTransaction}
        categories={categories}
      />

      <WeeklyBudgetModal
        isOpen={isWeeklyBudgetModalOpen}
        onClose={() => setIsWeeklyBudgetModalOpen(false)}
        onSave={(wb) => {
          setWeeklyBudgets([...weeklyBudgets, { ...wb, id: crypto.randomUUID() }]);
          toast.success('Presupuesto semanal agregado');
        }}
        categories={categories}
        currency={currency}
      />

      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        onSave={(reminder) => {
          setPaymentReminders([...paymentReminders, { ...reminder, id: crypto.randomUUID() }]);
          toast.success('Recordatorio agregado');
        }}
      />
    </div>
  );
}

// ===== TRANSACTION MODAL =====
function TransactionModal({ 
  isOpen, 
  onClose, 
  onSave, 
  categories, 
  transaction,
  availableTags,
  onAddTag
}: { 
  isOpen: boolean;
  onClose: () => void;
  onSave: (t: Omit<Transaction, 'id'>) => void;
  categories: Category[];
  transaction: Transaction | null;
  availableTags: string[];
  onAddTag: (tag: string) => void;
}) {
  const [formData, setFormData] = useState<Omit<Transaction, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    type: 'Expense',
    account: 'Cash',
    amount: 0,
    tags: [],
    notes: '',
  });

  useEffect(() => {
    if (transaction) {
      setFormData(transaction);
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: '',
        type: 'Expense',
        account: 'Cash',
        amount: 0,
        tags: [],
        notes: '',
      });
    }
  }, [transaction, isOpen]);

  const [newTag, setNewTag] = useState('');

  const handleAddTagToTransaction = () => {
    if (newTag.trim()) {
      const tag = newTag.trim();
      if (!formData.tags?.includes(tag)) {
        setFormData({ ...formData, tags: [...(formData.tags || []), tag] });
        onAddTag(tag);
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags?.filter(t => t !== tagToRemove) || [] });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Editar movimiento' : 'Agregar movimiento'}
          </DialogTitle>
          <DialogDescription>
            Completa los detalles de la transacción
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                value={formatNumberWithDots(formData.amount)}
                onChange={(e) => setFormData({ ...formData, amount: parseNumberFromDots(e.target.value) })}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: 'Income' | 'Expense') => 
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Income">Ingreso</SelectItem>
                  <SelectItem value="Expense">Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="account">Cuenta</Label>
              <Select 
                value={formData.account} 
                onValueChange={(value: 'Cash' | 'Bank' | 'Card') => 
                  setFormData({ ...formData, account: value })
                }
              >
                <SelectTrigger id="account">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Efectivo</SelectItem>
                  <SelectItem value="Bank">Banco</SelectItem>
                  <SelectItem value="Card">Tarjeta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.name} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Etiquetas (opcional)</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Ej: Trabajo, Viaje..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTagToTransaction();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddTagToTransaction}>
                <Tag className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Suggested tags */}
            {availableTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (!formData.tags?.includes(tag)) {
                        setFormData({ ...formData, tags: [...(formData.tags || []), tag] });
                      }
                    }}
                    className="text-xs px-2 py-1 rounded-md border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
            
            {/* Selected tags */}
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ej: Recibo guardado en Drive"
            />
            <p className="text-xs text-neutral-500">
              💡 Podés agregar detalles como número de factura, referencia, etc.
            </p>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {transaction ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===== BUDGET MODAL =====
function BudgetModal({ 
  isOpen, 
  onClose, 
  onSave, 
  categories,
  selectedMonth,
  budget 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onSave: (b: Omit<BudgetRow, 'id'>) => void;
  categories: Category[];
  selectedMonth: string;
  budget: BudgetRow | null;
}) {
  const [formData, setFormData] = useState<Omit<BudgetRow, 'id'>>({
    month: selectedMonth,
    category: '',
    budget: 0,
  });

  useEffect(() => {
    if (budget) {
      setFormData(budget);
    } else {
      setFormData({
        month: selectedMonth,
        category: '',
        budget: 0,
      });
    }
  }, [budget, selectedMonth, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {budget ? 'Editar presupuesto' : 'Agregar presupuesto'}
          </DialogTitle>
          <DialogDescription>
            Define el límite de gasto para una categoría
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="budget-category">Categoría</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger id="budget-category">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.name} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="budget-amount">Presupuesto</Label>
            <Input
              id="budget-amount"
              type="text"
              inputMode="numeric"
              value={formatNumberWithDots(formData.budget)}
              onChange={(e) => setFormData({ ...formData, budget: parseNumberFromDots(e.target.value) })}
              required
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {budget ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===== DEBT MODAL =====
function DebtModal({ 
  isOpen, 
  onClose, 
  onSave, 
  debt 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onSave: (d: Omit<Debt, 'id'>) => void;
  debt: Debt | null;
}) {
  const [formData, setFormData] = useState<Omit<Debt, 'id'>>({
    name: '',
    balance: 0,
    apr: undefined,
    monthlyPayment: 0,
    dueDay: 1,
  });

  useEffect(() => {
    if (debt) {
      setFormData(debt);
    } else {
      setFormData({
        name: '',
        balance: 0,
        apr: undefined,
        monthlyPayment: 0,
        dueDay: 1,
      });
    }
  }, [debt, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {debt ? 'Editar deuda' : 'Agregar deuda'}
          </DialogTitle>
          <DialogDescription>
            Registra los detalles de tu deuda
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="debt-name">Nombre</Label>
            <Input
              id="debt-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="debt-balance">Balance total</Label>
              <Input
                id="debt-balance"
                type="text"
                inputMode="numeric"
                value={formatNumberWithDots(formData.balance)}
                onChange={(e) => setFormData({ ...formData, balance: parseNumberFromDots(e.target.value) })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="debt-apr">APR % (opcional)</Label>
              <Input
                id="debt-apr"
                type="number"
                step="0.01"
                min="0"
                value={formData.apr || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  apr: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="debt-payment">Pago mensual</Label>
              <Input
                id="debt-payment"
                type="text"
                inputMode="numeric"
                value={formatNumberWithDots(formData.monthlyPayment)}
                onChange={(e) => setFormData({ ...formData, monthlyPayment: parseNumberFromDots(e.target.value) })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="debt-due">Día de vencimiento</Label>
              <Input
                id="debt-due"
                type="number"
                min="1"
                max="31"
                value={formData.dueDay}
                onChange={(e) => setFormData({ ...formData, dueDay: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {debt ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===== PAYOFF PLAN MODAL =====
function PayoffPlanModal({ 
  isOpen, 
  onClose, 
  debts,
  currency
}: { 
  isOpen: boolean;
  onClose: () => void;
  debts: Debt[];
  currency: string;
}) {
  const avalanche = useMemo(() => {
    return [...debts]
      .filter(d => d.apr !== undefined)
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
          <DialogDescription>
            Estrategias sugeridas para pagar tus deudas
          </DialogDescription>
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
              <p className="text-center text-neutral-500 py-8">
                No hay deudas con APR definido
              </p>
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
              <p className="text-center text-neutral-500 py-8">
                No hay deudas registradas
              </p>
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

// ===== GOAL MODAL =====
function GoalModal({ 
  isOpen, 
  onClose, 
  onSave, 
  goal,
  currency
}: { 
  isOpen: boolean;
  onClose: () => void;
  onSave: (g: Omit<MonthlyGoal, 'id' | 'month'>) => void;
  goal: MonthlyGoal | null;
  currency: string;
}) {
  const [formData, setFormData] = useState({
    savingsTarget: 0,
    variableSpendingLimit: 0,
    minimumDebtPayment: 0,
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        savingsTarget: goal.savingsTarget,
        variableSpendingLimit: goal.variableSpendingLimit,
        minimumDebtPayment: goal.minimumDebtPayment,
      });
    } else {
      setFormData({
        savingsTarget: 0,
        variableSpendingLimit: 0,
        minimumDebtPayment: 0,
      });
    }
  }, [goal, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const getCurrencySymbol = (curr: string) => {
    const symbols: Record<string, string> = {
      EUR: '€', USD: '$', MXN: '$', ARS: '$', COP: '$',
      CLP: '$', PEN: 'S/', PYG: '₲', GBP: '£'
    };
    return symbols[curr] || '$';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Plan del Mes</DialogTitle>
          <DialogDescription>
            Configurá tus 3 metas principales para el mes
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-violet-600" />
              Meta de ahorro ({getCurrencySymbol(currency)})
            </label>
            <Input
              type="text"
              inputMode="numeric"
              value={formatNumberWithDots(formData.savingsTarget)}
              onChange={(e) => setFormData({ ...formData, savingsTarget: parseNumberFromDots(e.target.value) })}
              placeholder="¿Cuánto querés ahorrar este mes?"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              Tope de gastos variables ({getCurrencySymbol(currency)})
            </label>
            <Input
              type="text"
              inputMode="numeric"
              value={formatNumberWithDots(formData.variableSpendingLimit)}
              onChange={(e) => setFormData({ ...formData, variableSpendingLimit: parseNumberFromDots(e.target.value) })}
              placeholder="Límite para gastos no esenciales"
            />
            <p className="text-xs text-neutral-500">
              Gastos como restaurantes, entretenimiento, compras, etc.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-orange-600" />
              Pago mínimo de deudas ({getCurrencySymbol(currency)})
            </label>
            <Input
              type="text"
              inputMode="numeric"
              value={formatNumberWithDots(formData.minimumDebtPayment)}
              onChange={(e) => setFormData({ ...formData, minimumDebtPayment: parseNumberFromDots(e.target.value) })}
              placeholder="Monto mínimo a pagar en deudas"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            💡 <strong>Tip:</strong> Estas metas te ayudan a tener un plan claro cada mes. 
            Revisalas y ajustalas según tus ingresos y prioridades.
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===== QUICK ADD MODAL =====
function QuickAddModal({ 
  isOpen, 
  onClose, 
  onSave, 
  categories 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onSave: (t: Omit<Transaction, 'id'>) => void;
  categories: Category[];
}) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) {
      toast.error('Monto y categoría son requeridos');
      return;
    }
    
    onSave({
      date: new Date().toISOString().split('T')[0],
      description: category, // Use category as description for quick add
      category,
      type,
      account: 'Cash',
      amount: parseNumberFromDots(amount),
      tags: [],
      notes: '',
    });
    
    // Reset form
    setAmount('');
    setCategory('');
    setType('Expense');
    onClose();
  };

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setCategory('');
      setType('Expense');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <DialogTitle>Quick Add</DialogTitle>
          </div>
          <DialogDescription>
            Agregar movimiento rápido de hoy
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={type === 'Expense' ? 'default' : 'outline'}
              className={type === 'Expense' ? 'bg-rose-600 hover:bg-rose-700' : ''}
              onClick={() => setType('Expense')}
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              Gasto
            </Button>
            <Button
              type="button"
              variant={type === 'Income' ? 'default' : 'outline'}
              className={type === 'Income' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              onClick={() => setType('Income')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Ingreso
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quick-amount">Monto</Label>
            <Input
              id="quick-amount"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(formatNumberWithDots(parseNumberFromDots(e.target.value)))}
              placeholder="0.00"
              autoFocus
              className="text-2xl font-semibold h-14"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quick-category">Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="quick-category">
                <SelectValue placeholder="Seleccionar…" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter(cat => type === 'Expense' ? true : cat.name === 'Salario' || cat.name === 'Freelance')
                  .map(cat => (
                    <SelectItem key={cat.name} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Zap className="w-4 h-4 mr-2" />
              Agregar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}