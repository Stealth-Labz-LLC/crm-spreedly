'use client'

import Link from 'next/link'
import type { Campaign, CampaignAnalytics } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChevronRight,
  Pencil,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Eye,
  MousePointer,
  Percent,
  BarChart3,
} from 'lucide-react'

interface CampaignAnalyticsDashboardProps {
  campaign: Campaign
  analytics: CampaignAnalytics[]
  totals: {
    impressions: number
    clicks: number
    orders_count: number
    orders_value: number
    refunds_count: number
    refunds_value: number
    conversionRate: number
    avgOrderValue: number
    totalOrders: number
  }
}

export function CampaignAnalyticsDashboard({
  campaign,
  analytics,
  totals,
}: CampaignAnalyticsDashboardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'draft': return 'bg-gray-400'
      case 'paused': return 'bg-yellow-500'
      default: return 'bg-gray-400'
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/campaigns" className="hover:text-foreground">CRM</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/campaigns" className="hover:text-foreground">Campaigns</Link>
            <ChevronRight className="h-4 w-4" />
            <span>Analytics</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <Badge variant="outline" className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${getStatusColor(campaign.status)}`} />
              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
            </Badge>
          </div>
        </div>
        <Link href={`/campaigns/${campaign.id}/edit`}>
          <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Campaign
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totals.orders_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {totals.orders_count} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals.conversionRate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {totals.clicks.toLocaleString()} clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totals.avgOrderValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals.impressions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              CTR: {totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Refunds Card */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-destructive">
                  -${totals.refunds_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground">{totals.refunds_count} refunds</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Refund Rate</p>
                <p className="text-lg">
                  {totals.orders_count > 0 ? ((totals.refunds_count / totals.orders_count) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Net Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  ${(totals.orders_value - totals.refunds_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground">After refunds</p>
              </div>
              <div className="text-right">
                {totals.orders_value > 0 && (
                  <>
                    <p className="text-sm font-medium">Retention</p>
                    <p className="text-lg">
                      {(((totals.orders_value - totals.refunds_value) / totals.orders_value) * 100).toFixed(1)}%
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Performance (Last 30 Days)</CardTitle>
          <CardDescription>Detailed breakdown of campaign metrics by day</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.length === 0 ? (
            <div className="py-8 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No analytics data yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Data will appear here once orders are placed through this campaign
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Conv. Rate</TableHead>
                  <TableHead className="text-right">AOV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.map((day) => (
                  <TableRow key={day.id}>
                    <TableCell className="font-medium">
                      {new Date(day.metric_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-right">{day.impressions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{day.clicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{day.orders_count}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${day.orders_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {day.clicks > 0 ? ((day.orders_count / day.clicks) * 100).toFixed(1) : 0}%
                    </TableCell>
                    <TableCell className="text-right">
                      ${day.orders_count > 0 ? (day.orders_value / day.orders_count).toFixed(2) : '0.00'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
