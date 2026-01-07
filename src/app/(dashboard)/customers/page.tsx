import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CustomerActions } from './customer-actions'
import type { Customer } from '@/types/database'

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search || ''
  const page = parseInt(params.page || '1')
  const pageSize = 10

  const supabase = await createServiceClient()

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (search) {
    query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
  }

  const { data, count } = await query
  const customers = (data || []) as Customer[]

  const totalPages = Math.ceil((count || 0) / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer database
          </p>
        </div>
        <Link href="/customers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <form className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search customers..."
                  defaultValue={search}
                  className="pl-9"
                />
              </div>
            </form>
            <div className="text-sm text-muted-foreground">
              {count || 0} total customers
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">No customers found</p>
                    <Link href="/customers/new">
                      <Button variant="link" className="mt-2">
                        Add your first customer
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                customers?.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Link
                        href={`/customers/${customer.id}`}
                        className="font-medium hover:underline"
                      >
                        {customer.first_name || customer.last_name
                          ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                          : 'No name'}
                      </Link>
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          customer.status === 'active'
                            ? 'default'
                            : customer.status === 'inactive'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <CustomerActions customer={customer} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`/customers?page=${page - 1}${search ? `&search=${search}` : ''}`}>
                    <Button variant="outline" size="sm">
                      Previous
                    </Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`/customers?page=${page + 1}${search ? `&search=${search}` : ''}`}>
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
