import { useGetDashboardStats, useListEstimates, useListInvoices } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency } from "@/lib/format";
import { 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Receipt,
  ArrowUpRight,
  Clock
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Link } from "wouter";

// Mock data for chart since API doesn't provide time-series revenue yet
const chartData = [
  { name: 'Jan', revenue: 4000, profit: 2400 },
  { name: 'Feb', revenue: 3000, profit: 1398 },
  { name: 'Mar', revenue: 2000, profit: 9800 },
  { name: 'Apr', revenue: 2780, profit: 3908 },
  { name: 'May', revenue: 1890, profit: 4800 },
  { name: 'Jun', revenue: 2390, profit: 3800 },
  { name: 'Jul', revenue: 3490, profit: 4300 },
];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: estimates } = useListEstimates();
  const { data: invoices } = useListInvoices();

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Overview</h1>
            <p className="text-muted-foreground mt-1">Track your projects, revenue, and margins.</p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/estimates" 
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
            >
              View Estimates
            </Link>
            <Link 
              href="/invoices" 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 shadow-[0_0_15px_rgba(250,204,21,0.2)] hover:shadow-[0_0_20px_rgba(250,204,21,0.4)] transition-all"
            >
              Create Invoice
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard 
            title="Total Revenue" 
            value={formatCurrency(stats?.totalRevenue || 0)} 
            icon={DollarSign}
            trend="+12.5%"
            loading={statsLoading}
          />
          <StatCard 
            title="Total Profit" 
            value={formatCurrency(stats?.totalProfit || 0)} 
            icon={TrendingUp}
            trend="+8.2%"
            loading={statsLoading}
            highlight
          />
          <StatCard 
            title="Pending Estimates" 
            value={(stats?.pendingEstimates || 0).toString()} 
            icon={FileText}
            subValue={`${stats?.totalEstimates || 0} Total`}
            loading={statsLoading}
          />
          <StatCard 
            title="Overdue Invoices" 
            value={(stats?.overdueInvoices || 0).toString()} 
            icon={Clock}
            subValue={`${stats?.totalInvoices || 0} Total`}
            loading={statsLoading}
            destructive={(stats?.overdueInvoices || 0) > 0}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-display font-semibold">Revenue & Profit Trend</h2>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(value) => `$${value/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="profit" stroke="hsl(var(--accent))" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-display font-semibold">Recent Estimates</h2>
              <Link href="/estimates" className="text-sm text-primary hover:underline">View All</Link>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {estimates?.slice(0, 5).map(est => (
                <Link key={est.id} href={`/estimates/${est.id}`} className="block group">
                  <div className="flex justify-between items-start p-3 rounded-lg border border-transparent hover:border-border hover:bg-secondary/50 transition-all">
                    <div>
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">{est.projectName}</p>
                      <p className="text-xs text-muted-foreground mt-1">{est.clientName || 'No Client'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold">{formatCurrency(est.total)}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium mt-1
                        ${est.status === 'approved' ? 'bg-green-500/10 text-green-500' : 
                          est.status === 'draft' ? 'bg-secondary text-muted-foreground' : 
                          'bg-primary/10 text-primary'}`}
                      >
                        {est.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              
              {(!estimates || estimates.length === 0) && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No recent estimates found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  subValue, 
  loading,
  highlight,
  destructive
}: { 
  title: string; 
  value: string; 
  icon: any; 
  trend?: string; 
  subValue?: string;
  loading?: boolean;
  highlight?: boolean;
  destructive?: boolean;
}) {
  return (
    <div className={`
      relative overflow-hidden rounded-xl p-6 border transition-all duration-300
      ${highlight 
        ? 'bg-gradient-to-br from-card to-card border-primary/30 shadow-[0_4px_20px_-5px_rgba(250,204,21,0.1)]' 
        : destructive
        ? 'bg-card border-destructive/30'
        : 'bg-card border-border hover:border-primary/20'}
    `}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-secondary animate-pulse rounded mt-1"></div>
          ) : (
            <h3 className={`text-2xl font-mono font-bold ${destructive ? 'text-destructive' : 'text-foreground'}`}>
              {value}
            </h3>
          )}
        </div>
        <div className={`
          p-3 rounded-lg 
          ${highlight ? 'bg-primary/10 text-primary' : 
            destructive ? 'bg-destructive/10 text-destructive' : 
            'bg-secondary text-muted-foreground'}
        `}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      {(trend || subValue) && (
        <div className="mt-4 flex items-center text-sm">
          {trend && (
            <span className="flex items-center text-green-500 font-medium">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              {trend}
            </span>
          )}
          {subValue && (
            <span className="text-muted-foreground">{subValue}</span>
          )}
        </div>
      )}
    </div>
  );
}
