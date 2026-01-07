'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CampaignCountry } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Globe } from 'lucide-react'
import { toast } from 'sonner'

interface CountriesSectionProps {
  campaignId: string
}

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'IE', name: 'Ireland' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'IN', name: 'India' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
]

const REGIONS = {
  'North America': ['US', 'CA', 'MX'],
  'Europe': ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PL', 'PT'],
  'Asia Pacific': ['AU', 'NZ', 'JP', 'KR', 'SG', 'HK', 'IN'],
  'Middle East & Africa': ['ZA', 'AE', 'SA'],
  'South America': ['BR'],
}

export function CountriesSection({ campaignId }: CountriesSectionProps) {
  const supabase = createClient()
  const [countries, setCountries] = useState<CampaignCountry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    loadCountries()
  }, [campaignId])

  const loadCountries = async () => {
    const { data, error } = await supabase
      .from('campaign_countries')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('country_name')

    if (error) {
      toast.error('Failed to load countries')
      return
    }

    setCountries(data || [])
    setIsLoading(false)
  }

  const handleAddCountry = async () => {
    if (!selectedCountry) return

    const country = COUNTRIES.find(c => c.code === selectedCountry)
    if (!country) return

    // Check if already added
    if (countries.some(c => c.country_code === selectedCountry)) {
      toast.error('Country already added')
      return
    }

    setIsAdding(true)
    try {
      const { error } = await supabase.from('campaign_countries').insert({
        campaign_id: campaignId,
        country_code: country.code,
        country_name: country.name,
        is_active: true,
      } as never)

      if (error) throw error

      toast.success('Country added')
      setSelectedCountry('')
      loadCountries()
    } catch (error) {
      toast.error('Failed to add country')
    } finally {
      setIsAdding(false)
    }
  }

  const handleAddRegion = async (regionName: string) => {
    const regionCodes = REGIONS[regionName as keyof typeof REGIONS]
    if (!regionCodes) return

    const existingCodes = countries.map(c => c.country_code)
    const newCountries = COUNTRIES.filter(
      c => regionCodes.includes(c.code) && !existingCodes.includes(c.code)
    )

    if (newCountries.length === 0) {
      toast.info('All countries in this region are already added')
      return
    }

    try {
      const { error } = await supabase.from('campaign_countries').insert(
        newCountries.map(c => ({
          campaign_id: campaignId,
          country_code: c.code,
          country_name: c.name,
          is_active: true,
        })) as never
      )

      if (error) throw error

      toast.success(`Added ${newCountries.length} countries from ${regionName}`)
      loadCountries()
    } catch (error) {
      toast.error('Failed to add region')
    }
  }

  const handleRemoveCountry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('campaign_countries')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Country removed')
      loadCountries()
    } catch (error) {
      toast.error('Failed to remove country')
    }
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('campaign_countries')
        .update({ is_active: !currentActive } as never)
        .eq('id', id)

      if (error) throw error

      loadCountries()
    } catch (error) {
      toast.error('Failed to update country')
    }
  }

  const availableCountries = COUNTRIES.filter(
    c => !countries.some(ec => ec.country_code === c.code)
  )

  if (isLoading) {
    return <div className="flex items-center justify-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Countries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Country */}
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a country to add" />
                </SelectTrigger>
                <SelectContent>
                  {availableCountries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name} ({country.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddCountry} disabled={!selectedCountry || isAdding}>
              <Plus className="mr-2 h-4 w-4" />
              Add Country
            </Button>
          </div>

          {/* Quick Add Regions */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground py-1">Quick add:</span>
            {Object.keys(REGIONS).map((region) => (
              <Button
                key={region}
                variant="outline"
                size="sm"
                onClick={() => handleAddRegion(region)}
              >
                {region}
              </Button>
            ))}
          </div>

          {/* Countries Table */}
          {countries.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No countries added yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countries.map((country) => (
                  <TableRow key={country.id}>
                    <TableCell className="font-medium">{country.country_name}</TableCell>
                    <TableCell className="font-mono">{country.country_code}</TableCell>
                    <TableCell>
                      <Badge
                        variant={country.is_active ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => handleToggleActive(country.id, country.is_active)}
                      >
                        {country.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCountry(country.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="text-sm text-muted-foreground">
            {countries.length} {countries.length === 1 ? 'country' : 'countries'} configured
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
