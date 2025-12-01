# Sales Dashboard

A React-based sales dashboard with filtering, sorting, pagination, and data visualization.

## Features

- 📊 Interactive time-series chart
- 🔍 Advanced filtering (date range, price, email, phone)
- 📄 Paginated sales table (50 items per page)
- ⬆️⬇️ Sortable columns (date & price)
- 💾 Caching for better performance
- 📱 Fully responsive design

## Setup Instructions

1. **Clone the repository**

```bash
   git clone <your-repo-url>
   cd sales-dashboard
```

2. **Install dependencies**

```bash
   npm install
```

3. **Configure API**

   - Open `src/components/SalesDashboard.jsx`
   - Replace `YOUR_API_BASE_URL` with your actual API URL
   - Update the authorization body in the `getAuthorization` function

4. **Run the app**

```bash
   npm start
```

5. **Build for production**

```bash
   npm run build
```

## Deployment

### Vercel

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm run build
# Drag and drop the 'build' folder to Netlify
```

## Technologies Used

- React 18
- Tailwind CSS
- Recharts
- Lucide React Icons
