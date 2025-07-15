# Accounts Management System

VsdvBillsoft now includes a comprehensive accounts management system that allows you to track all your financial transactions, manage cash flow, and generate detailed financial reports.

## 🎯 Features

### 📊 **Accounts Overview**
- Real-time account balances
- Multiple account types (Cash, Bank, Credit, Investment)
- Transaction history
- Cash flow visualization
- Quick financial summary cards

### 📋 **Daily Ledger**
- Track daily income and expenses
- Categorize transactions
- Add detailed notes and references
- Real-time daily totals
- Easy entry management

### 💰 **Payments Management**
- Track both received and sent payments
- Multiple payment methods (Cash, Check, Bank Transfer, Credit Card, Mobile Payment)
- Payment status tracking
- Customer/vendor management
- Reference linking to invoices

### 💸 **Expenses Tracking**
- Categorized expense management
- Vendor tracking
- Receipt management
- Tax deductibility tracking
- Expense analysis and reporting

### 📈 **Financial Reports**
- Profit & Loss Statement
- Cash Flow Statement
- Balance Sheet
- Expense Analysis
- Income Analysis
- Customizable date ranges

### ⚙️ **Settings & Configuration**
- Currency management
- Fiscal year configuration
- Tax rate settings
- Alert preferences
- Data export and backup

## 🚀 Getting Started

### 1. Database Setup

Run the accounts schema to set up the database tables:

```sql
-- Execute the schema-accounts.sql file in your Supabase dashboard
```

### 2. Navigation

Access the accounts system through the main navigation:
- **Accounts** → Overview, Daily Ledger, Payments, Expenses, Reports, Settings

### 3. Initial Setup

1. **Configure Accounts**: Set up your bank accounts, cash accounts, and other financial accounts
2. **Set Currency**: Choose your default currency in Accounts Settings
3. **Configure Categories**: Customize income and expense categories
4. **Set Up Alerts**: Configure low cash alerts and notification preferences

## 📱 Usage Guide

### Adding Daily Transactions

1. Go to **Accounts** → **Daily Ledger**
2. Click **Add Entry**
3. Fill in transaction details:
   - Date and description
   - Type (Income/Expense)
   - Amount and account
   - Category and payment method
   - Reference number and notes

### Managing Payments

1. Go to **Accounts** → **Payments**
2. Click **Add Payment**
3. Enter payment details:
   - Type (Received/Sent)
   - Customer/vendor information
   - Amount and payment method
   - Status and reference

### Tracking Expenses

1. Go to **Accounts** → **Expenses**
2. Click **Add Expense**
3. Record expense information:
   - Description and amount
   - Category and vendor
   - Payment method
   - Receipt and tax information

### Generating Reports

1. Go to **Accounts** → **Reports**
2. Select report type:
   - Profit & Loss Statement
   - Cash Flow Statement
   - Balance Sheet
   - Expense/Income Analysis
3. Choose date range
4. Generate and print/export

## 🔧 Technical Details

### Database Schema

The accounts system uses the following main tables:

- **accounts**: Bank accounts, cash accounts, credit accounts
- **ledger_entries**: Daily income and expense transactions
- **payments**: Payment tracking (received/sent)
- **expenses**: Detailed expense management
- **chart_of_accounts**: Chart of accounts structure
- **budgets**: Budget management
- **financial_periods**: Financial periods for reporting

### Key Features

- **Automatic Balance Updates**: Account balances are automatically updated when transactions are added
- **Real-time Calculations**: All totals and summaries are calculated in real-time
- **Multi-currency Support**: Support for multiple currencies with conversion
- **Category Management**: Flexible categorization system
- **Reference Linking**: Link transactions to invoices, receipts, and other documents

### API Integration

The accounts system integrates with:
- Supabase for data storage
- Clerk for user authentication
- Currency context for multi-currency support
- Permissions system for access control

## 📊 Financial Reports

### Profit & Loss Statement
- Income breakdown by category
- Expense breakdown by category
- Net income calculation
- Period comparisons

### Cash Flow Statement
- Operating activities
- Investing activities
- Financing activities
- Net cash flow

### Balance Sheet
- Current and fixed assets
- Current and long-term liabilities
- Owner's equity
- Balance verification

### Expense Analysis
- Expenses by category
- Vendor analysis
- Trending and comparisons
- Budget vs actual

## 🔐 Security & Permissions

- **Row Level Security**: All data is protected with RLS policies
- **User Isolation**: Users can only access their own financial data
- **Permission-based Access**: Integrated with the existing permissions system
- **Audit Trail**: All transactions include creation and modification timestamps

## 📱 Mobile Responsive

The accounts system is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- Touch interfaces

## 🎨 Customization

### Themes
- Supports light and dark themes
- Consistent with the main application theme
- Customizable color schemes

### Categories
- Customizable income categories
- Customizable expense categories
- Hierarchical category structure

### Currencies
- Multiple currency support
- Automatic currency conversion
- Currency-specific formatting

## 🔄 Data Management

### Export Options
- CSV export for spreadsheet analysis
- PDF export for reporting
- JSON export for data migration

### Backup & Restore
- Automatic backup capabilities
- Manual backup creation
- Data restore functionality

### Integration
- Links with existing billing system
- Integrates with inventory management
- Connects with customer management

## 📞 Support

For help with the accounts system:
1. Check the in-app help documentation
2. Review the settings and configuration options
3. Contact system administrator for advanced features

## 🔮 Future Enhancements

Planned features for future releases:
- Advanced budgeting with forecasting
- Multi-company support
- Tax preparation integration
- Advanced reporting with charts
- Mobile app for expense tracking
- Receipt scanning with OCR
- Integration with banking APIs
- Advanced analytics and insights

## 📝 Best Practices

### Daily Usage
1. **Enter transactions daily** for accurate tracking
2. **Categorize consistently** for better reporting
3. **Add reference numbers** for easy cross-referencing
4. **Include detailed notes** for future reference

### Monthly Tasks
1. **Review account balances** and reconcile
2. **Generate monthly reports** for analysis
3. **Update budgets** based on actual performance
4. **Archive old transactions** to maintain performance

### Quarterly Tasks
1. **Generate comprehensive reports** for stakeholders
2. **Review and update categories** as needed
3. **Analyze trends** and adjust strategies
4. **Backup financial data** for security

## 🏆 Benefits

- **Complete Financial Visibility**: See all your money in one place
- **Improved Cash Flow Management**: Track money in and out
- **Better Decision Making**: Data-driven financial decisions
- **Time Savings**: Automated calculations and reporting
- **Compliance Ready**: Proper record keeping for audits
- **Scalable**: Grows with your business needs

## 🔧 API Integration

The accounts system is now fully integrated with Supabase database:

### Real Database Operations
- All components use live API calls (no more sample data)
- Real-time CRUD operations for all entities
- Automatic balance calculations via database triggers
- Row Level Security (RLS) for data protection

### Available APIs
- `accountsAPI` - Account management and balances
- `ledgerAPI` - Daily ledger operations
- `paymentsAPI` - Payment tracking and management
- `expensesAPI` - Expense management and analysis
- `reportsAPI` - Financial reporting and analytics
- `chartAPI` - Chart of accounts management

### Setup Files
- `schema-accounts.sql` - Main database schema
- `schema-accounts-initial.sql` - Initial chart of accounts
- `test-accounts-system.sql` - System verification tests
- `src/utils/accountsAPI.js` - API function library

### Key Features
- **Live Data**: All data is fetched from and saved to Supabase
- **Real-time Updates**: Changes reflect immediately across the system
- **Secure**: User-based data isolation with RLS policies
- **Scalable**: Efficient queries and proper indexing
- **Auditable**: Full transaction history and user tracking

The system is now production-ready with full database integration!
