# VsdvBillsoft Inventory Management System

A comprehensive inventory management web application with Supabase integration.

## Features

### Product Management
- Product CRUD operations with detailed information
- Product variants management (size, color, etc.)
- Product images upload and management
- Product categorization and filtering

### Inventory Tracking
- Real-time stock level monitoring
- Stock movement history
- Low stock alerts
- Batch tracking with expiry dates
- Inventory dashboards with key metrics

### Supplier Management
- Supplier CRUD operations
- Purchase order management
- Supplier performance metrics
- Order history tracking

### User Notifications
- Low stock alerts
- Expiring product alerts
- Order status updates
- System notifications

## Technical Architecture

### Frontend
- React.js with Vite
- Tailwind CSS
- Framer Motion for animations

### Backend
- Supabase for backend as a service
- PostgreSQL database
- Supabase Auth for authentication
- Supabase Storage for file uploads
- Supabase Row Level Security for data protectionte

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Database Schema

The application uses the following tables:

- **Users**: User information (linked to Supabase Auth)
- **Suppliers**: Supplier details and contact information
- **Products**: Core product information
- **Product Variants**: Product variants by attribute (size, color, etc.)
- **Product Images**: Images associated with products
- **Stock Movements**: History of all inventory changes
- **Product Batches**: Batch tracking with expiry dates
- **Purchase Orders**: Orders placed with suppliers
- **Order Items**: Line items in purchase orders
- **Notifications**: System notifications and alerts

## Setting Up

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/VsdvBillsoft.git
cd VsdvBillsoft
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Supabase
1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Execute the schema SQL in your Supabase SQL Editor (see `schema.sql`)
3. Set up storage buckets as described in `supabase-setup.md`
4. Update your Supabase credentials in `src/supabaseClient.js`

### 4. Run the Application
```bash
npm run dev
```

### 5. Seed Demo Data (optional)
```javascript
import { seedDatabase } from './src/utils/dbSeeder';
seedDatabase().then(() => console.log('Database seeded!'));
```

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

## License
This project is licensed under the MIT License - see the LICENSE file for details.
