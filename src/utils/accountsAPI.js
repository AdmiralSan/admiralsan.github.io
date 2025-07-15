import { supabase } from '../supabaseClient';
import { getCurrentUserId, ensureUserExists } from './clerkUserUtils';

// Helper function to get current user from Clerk
const getCurrentUser = async (userId = null) => {
  try {
    // If userId is provided, use it directly (but still ensure user exists)
    if (userId) {
      // Check if this is a Clerk user ID and ensure they exist in database
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (!existingUser) {
        throw new Error(`User ${userId} not found in database. Please ensure user is synchronized.`);
      }
      
      return { id: userId };
    }
    
    // Get current user from Clerk and ensure they exist in database
    if (typeof window !== 'undefined' && window.Clerk) {
      const clerkUser = window.Clerk.user;
      if (clerkUser) {
        // Ensure user exists in database
        await ensureUserExists(clerkUser);
        return { id: clerkUser.id };
      }
    }
    
    throw new Error('User not authenticated');
  } catch (error) {
    console.error('Error getting current user:', error);
    throw new Error('User not authenticated: ' + error.message);
  }
};

// Accounts API functions
export const accountsAPI = {
  // Get all accounts for current user
  async getAccounts() {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true)
        .order('account_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  },

  // Create new account
  async createAccount(accountData, userId = null) {
    try {
      const user = await getCurrentUser(userId);
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('accounts')
        .insert({
          ...accountData,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  },

  // Update account
  async updateAccount(id, accountData) {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .update({
          ...accountData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  },

  // Delete account
  async deleteAccount(id) {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },

  // Get account balance summary
  async getAccountSummary() {
    try {
      const { data, error } = await supabase
        .from('account_balances_summary')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching account summary:', error);
      throw error;
    }
  }
};

// Ledger Entries API functions
export const ledgerAPI = {
  // Get ledger entries
  async getLedgerEntries(filters = {}) {
    try {
      let query = supabase
        .from('ledger_entries')
        .select('*');

      if (filters.date) {
        query = query.eq('entry_date', filters.date);
      }

      if (filters.type) {
        query = query.eq('entry_type', filters.type);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      query = query.order('entry_date', { ascending: false })
                   .order('entry_time', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching ledger entries:', error);
      throw error;
    }
  },

  // Create ledger entry
  async createLedgerEntry(entryData, userId = null) {
    try {
      const user = await getCurrentUser(userId);
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('ledger_entries')
        .insert({
          ...entryData,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating ledger entry:', error);
      throw error;
    }
  },

  // Update ledger entry
  async updateLedgerEntry(id, entryData) {
    try {
      const { data, error } = await supabase
        .from('ledger_entries')
        .update({
          ...entryData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating ledger entry:', error);
      throw error;
    }
  },

  // Delete ledger entry
  async deleteLedgerEntry(id) {
    try {
      const { error } = await supabase
        .from('ledger_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting ledger entry:', error);
      throw error;
    }
  },

  // Get daily summary
  async getDailySummary(date) {
    try {
      const { data, error } = await supabase
        .from('daily_ledger_summary')
        .select('*')
        .eq('entry_date', date)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      return data || {
        total_income: 0,
        total_expenses: 0,
        net_amount: 0,
        transaction_count: 0
      };
    } catch (error) {
      console.error('Error fetching daily summary:', error);
      throw error;
    }
  }
};

// Payments API functions
export const paymentsAPI = {
  // Get payments
  async getPayments(filters = {}) {
    try {
      let query = supabase
        .from('payments')
        .select('*');

      if (filters.type) {
        query = query.eq('payment_type', filters.type);
      }

      if (filters.status) {
        query = query.eq('payment_status', filters.status);
      }

      if (filters.startDate && filters.endDate) {
        query = query.gte('payment_date', filters.startDate)
                     .lte('payment_date', filters.endDate);
      }

      query = query.order('payment_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  },

  // Create payment
  async createPayment(paymentData, userId = null) {
    try {
      const user = await getCurrentUser(userId);
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('payments')
        .insert({
          ...paymentData,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  // Update payment
  async updatePayment(id, paymentData) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({
          ...paymentData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  },

  // Delete payment
  async deletePayment(id) {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  }
};

// Expenses API functions
export const expensesAPI = {
  // Get expenses
  async getExpenses(filters = {}) {
    try {
      let query = supabase
        .from('expenses')
        .select('*');

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.startDate && filters.endDate) {
        query = query.gte('expense_date', filters.startDate)
                     .lte('expense_date', filters.endDate);
      }

      query = query.order('expense_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  },

  // Create expense
  async createExpense(expenseData, userId = null) {
    try {
      const user = await getCurrentUser(userId);
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expenseData,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  },

  // Update expense
  async updateExpense(id, expenseData) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update({
          ...expenseData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  },

  // Delete expense
  async deleteExpense(id) {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  },

  // Get expense analysis
  async getExpenseAnalysis() {
    try {
      const { data, error } = await supabase
        .from('expense_analysis')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching expense analysis:', error);
      throw error;
    }
  }
};

// Chart of Accounts API functions
export const chartAPI = {
  // Get chart of accounts
  async getChartOfAccounts() {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('is_active', true)
        .order('account_code');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching chart of accounts:', error);
      throw error;
    }
  },

  // Create chart account
  async createChartAccount(accountData, userId = null) {
    try {
      const user = await getCurrentUser(userId);
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('chart_of_accounts')
        .insert({
          ...accountData,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating chart account:', error);
      throw error;
    }
  }
};

// Reports API functions
export const dashboardAPI = {
  // Get all quick stats for the dashboard
  async getQuickStats() {
    try {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
      
      // Get total cash (sum of all accounts with type 'cash')
      const { data: cashAccounts, error: cashError } = await supabase
        .from('accounts')
        .select('current_balance')
        .eq('account_type', 'cash');
      
      if (cashError) throw cashError;
      
      const totalCash = cashAccounts?.reduce((total, account) => 
        total + parseFloat(account.current_balance || 0), 0) || 0;
      
      // Get receivables (sum of all outstanding invoices/payments owed to the business)
      const { data: receivables, error: receivablesError } = await supabase
        .from('payments')
        .select('amount')
        .eq('payment_type', 'received')
        .eq('payment_status', 'pending');
      
      if (receivablesError) throw receivablesError;
      
      const totalReceivables = receivables?.reduce((total, payment) => 
        total + parseFloat(payment.amount || 0), 0) || 0;
      
      // Get payables (sum of all outstanding expenses/payments owed by the business)
      const { data: payables, error: payablesError } = await supabase
        .from('payments')
        .select('amount')
        .eq('payment_type', 'sent')
        .eq('payment_status', 'pending');
      
      if (payablesError) throw payablesError;
      
      const totalPayables = payables?.reduce((total, payment) => 
        total + parseFloat(payment.amount || 0), 0) || 0;
      
      // Get monthly revenue (sum of all income entries for current month)
      const { data: monthlyIncome, error: incomeError } = await supabase
        .from('ledger_entries')
        .select('amount')
        .eq('entry_type', 'income')
        .gte('entry_date', firstDayOfMonth)
        .lte('entry_date', lastDayOfMonth);
      
      if (incomeError) throw incomeError;
      
      const monthlyRevenue = monthlyIncome?.reduce((total, entry) => 
        total + parseFloat(entry.amount || 0), 0) || 0;
      
      // Get monthly expenses
      const { data: monthlyExpenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', firstDayOfMonth)
        .lte('expense_date', lastDayOfMonth);
      
      if (expenseError) throw expenseError;
      
      const monthlyExpenses = monthlyExpenseData?.reduce((total, expense) => 
        total + parseFloat(expense.amount || 0), 0) || 0;
      
      // Calculate net profit
      const netProfit = monthlyRevenue - monthlyExpenses;
      
      return {
        totalCash,
        totalReceivables,
        totalPayables,
        monthlyRevenue,
        monthlyExpenses,
        netProfit
      };
    } catch (error) {
      console.error('Error fetching quick stats:', error);
      throw error;
    }
  }
};

export const reportsAPI = {
  // Get profit and loss data
  async getProfitLossData(startDate, endDate) {
    try {
      // Get income data
      const { data: incomeData, error: incomeError } = await supabase
        .from('ledger_entries')
        .select('category, amount')
        .eq('entry_type', 'income')
        .gte('entry_date', startDate)
        .lte('entry_date', endDate);

      if (incomeError) throw incomeError;

      // Get expense data
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('category, amount')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate);

      if (expenseError) throw expenseError;

      // Aggregate income by category
      const income = {};
      incomeData?.forEach(item => {
        income[item.category] = (income[item.category] || 0) + parseFloat(item.amount);
      });

      // Aggregate expenses by category
      const expenses = {};
      expenseData?.forEach(item => {
        expenses[item.category] = (expenses[item.category] || 0) + parseFloat(item.amount);
      });

      return {
        income,
        expenses,
        period: `${startDate} to ${endDate}`
      };
    } catch (error) {
      console.error('Error fetching profit loss data:', error);
      throw error;
    }
  },

  // Get cash flow data
  async getCashFlowData(startDate, endDate) {
    try {
      // Get payments data
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('payment_type, amount, payment_status')
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);

      if (paymentsError) throw paymentsError;

      // Get ledger entries data
      const { data: ledgerData, error: ledgerError } = await supabase
        .from('ledger_entries')
        .select('entry_type, amount')
        .gte('entry_date', startDate)
        .lte('entry_date', endDate);

      if (ledgerError) throw ledgerError;

      const completedPayments = paymentsData?.filter(p => p.payment_status === 'completed') || [];
      
      const operating_activities = {
        cash_receipts: completedPayments
          .filter(p => p.payment_type === 'received')
          .reduce((sum, p) => sum + parseFloat(p.amount), 0),
        cash_payments: completedPayments
          .filter(p => p.payment_type === 'sent')
          .reduce((sum, p) => sum + parseFloat(p.amount), 0) * -1,
        net_income: ledgerData
          ?.reduce((sum, l) => {
            return sum + (l.entry_type === 'income' ? parseFloat(l.amount) : -parseFloat(l.amount));
          }, 0) || 0
      };

      return {
        operating_activities,
        investing_activities: {},
        financing_activities: {}
      };
    } catch (error) {
      console.error('Error fetching cash flow data:', error);
      throw error;
    }
  },

  // Get balance sheet data
  async getBalanceSheetData() {
    try {
      // Get accounts data
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true);

      if (accountsError) throw accountsError;

      const assets = {
        current_assets: {},
        fixed_assets: {}
      };

      const liabilities = {
        current_liabilities: {},
        long_term_liabilities: {}
      };

      const equity = {
        owner_equity: 0,
        retained_earnings: 0
      };

      // Categorize accounts
      accountsData?.forEach(account => {
        const balance = parseFloat(account.current_balance);
        
        switch (account.account_type) {
          case 'cash':
          case 'bank':
            assets.current_assets[account.account_name.toLowerCase().replace(/\s+/g, '_')] = balance;
            break;
          case 'investment':
            assets.fixed_assets[account.account_name.toLowerCase().replace(/\s+/g, '_')] = balance;
            break;
          case 'credit':
            liabilities.current_liabilities[account.account_name.toLowerCase().replace(/\s+/g, '_')] = Math.abs(balance);
            break;
        }
      });

      // Calculate retained earnings from profit/loss
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;
      
      const profitLossData = await this.getProfitLossData(startDate, endDate);
      const totalIncome = Object.values(profitLossData.income).reduce((sum, val) => sum + val, 0);
      const totalExpenses = Object.values(profitLossData.expenses).reduce((sum, val) => sum + val, 0);
      equity.retained_earnings = totalIncome - totalExpenses;

      return {
        assets,
        liabilities,
        equity
      };
    } catch (error) {
      console.error('Error fetching balance sheet data:', error);
      throw error;
    }
  }
};
