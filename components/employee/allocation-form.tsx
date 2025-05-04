"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useCompanies } from "@/hooks/use-companies"
import { useBranches } from "@/hooks/use-branches"
import { useProjects } from "@/hooks/use-projects"
import type { Allocation, AllocationFormData } from "@/hooks/use-employee-allocations"

// Define the form schema
const formSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  branchId: z.string().min(1, "Branch is required"),
  projectId: z.string().optional(),
  percentage: z.coerce.number().min(1, "Percentage must be at least 1").max(100, "Percentage cannot exceed 100"),
  isPrimary: z.boolean().default(false),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
})

type AllocationFormProps = {
  employeeId: string
  allocation?: Allocation
  currentTotal: number
  onSubmit: (data: AllocationFormData) => Promise<boolean>
  onCancel: () => void
}

export function AllocationForm({ employeeId, allocation, currentTotal, onSubmit, onCancel }: AllocationFormProps) {
  const { companies, isLoading: isLoadingCompanies } = useCompanies()
  const { branches, isLoading: isLoadingBranches, fetchBranchesByCompany } = useBranches()
  const { projects, isLoading: isLoadingProjects, fetchProjectsByCompany } = useProjects()

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(allocation?.companyId || "")

  // Initialize form with default values or existing allocation data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: allocation?.companyId || "",
      branchId: allocation?.branchId || "",
      projectId: allocation?.projectId || "",
      percentage: allocation?.percentage || 0,
      isPrimary: allocation?.isPrimary || false,
      startDate: allocation?.startDate ? new Date(allocation.startDate) : null,
      endDate: allocation?.endDate ? new Date(allocation.endDate) : null,
    },
  })

  // Watch for changes to the company selection
  const watchCompanyId = form.watch("companyId")

  // Load branches when company changes
  useEffect(() => {
    if (watchCompanyId) {
      setSelectedCompanyId(watchCompanyId)
      fetchBranchesByCompany(watchCompanyId)
      fetchProjectsByCompany(watchCompanyId)
    }
  }, [watchCompanyId, fetchBranchesByCompany, fetchProjectsByCompany])

  // Load branches and projects for the initial company if editing
  useEffect(() => {
    if (allocation?.companyId) {
      fetchBranchesByCompany(allocation.companyId)
      fetchProjectsByCompany(allocation.companyId)
    }
  }, [allocation, fetchBranchesByCompany, fetchProjectsByCompany])

  // Calculate the maximum allowed percentage
  const maxPercentage = allocation ? 100 - currentTotal + allocation.percentage : 100 - currentTotal

  // Handle form submission
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    // Format dates for API submission
    const formattedData: AllocationFormData = {
      ...values,
      startDate: values.startDate ? format(values.startDate, "yyyy-MM-dd") : null,
      endDate: values.endDate ? format(values.endDate, "yyyy-MM-dd") : null,
    }

    // Validate percentage against maximum allowed
    if (values.percentage > maxPercentage) {
      form.setError("percentage", {
        type: "manual",
        message: `Percentage cannot exceed ${maxPercentage}%`,
      })
      return
    }

    const success = await onSubmit(formattedData)
    if (success) {
      form.reset()
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="companyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <Select disabled={isLoadingCompanies} onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="branchId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch</FormLabel>
              <Select
                disabled={isLoadingBranches || !selectedCompanyId}
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project (Optional)</FormLabel>
              <Select
                disabled={isLoadingProjects || !selectedCompanyId}
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Allocation Percentage</FormLabel>
              <FormControl>
                <Input type="number" min={1} max={maxPercentage} {...field} />
              </FormControl>
              <FormDescription>Maximum available: {maxPercentage}%</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Start Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>End Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value || undefined}
                    onSelect={field.onChange}
                    initialFocus
                    disabled={(date) => {
                      // Disable dates before start date
                      const startDate = form.getValues("startDate")
                      return startDate ? date < startDate : false
                    }}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPrimary"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Primary Allocation</FormLabel>
                <FormDescription>Set this as the employee's primary company allocation</FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{allocation ? "Update" : "Add"} Allocation</Button>
        </div>
      </form>
    </Form>
  )
}
