"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  LogOut,
  DollarSign,
  Activity,
  Users,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useLogout, useRequireAuth } from "@/hooks/use-authentication"
import { useMyProjects } from "@/hooks/use-projects"

export default function DashboardPage() {
  const { user, isLoading } = useRequireAuth()
  const router = useRouter()
  const shouldLoadProjects = !isLoading && user?.role === "SME"
  const { data: projects = [], isLoading: isProjectsLoading } = useMyProjects(shouldLoadProjects)
  const { mutate: logout } = useLogout()

  useEffect(() => {
    if (user?.role === "SME" && !isProjectsLoading && projects.length === 0) {
      router.replace("/project-application")
    }
  }, [isProjectsLoading, projects.length, router, user?.role])

  if (isLoading || isProjectsLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Loading dashboard...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Welcome, {user?.full_name || "Guest"}!
          </h2>
          <p className="text-sm text-muted-foreground">
            Account Role:{" "}
            <span className="uppercase font-semibold">{user?.role}</span>
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => logout()}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* KPI Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,284,430</div>
            <p className="text-xs text-muted-foreground flex items-center pt-1">
              <span className="text-emerald-500 flex items-center mr-1">
                <ArrowUpRight className="h-3 w-3" /> +20.1%
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.role === "SME" ? projects.length : "-"}</div>
            <p className="text-xs text-muted-foreground flex items-center pt-1">
              <span className="text-blue-500 flex items-center mr-1">
                <ArrowUpRight className="h-3 w-3" /> +2
              </span>
              new since yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accredited Investors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">573</div>
            <p className="text-xs text-muted-foreground pt-1">Verified members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground pt-1">
              Average platform yield
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="p-6">
        <CardTitle className="mb-4">My Projects</CardTitle>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {user?.role !== "SME" ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Investors do not manage projects from this view.
                </TableCell>
              </TableRow>
            ) : projects.length > 0 ? (
              projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>{project.legal_name}</TableCell>
                  <TableCell>{project.industry}</TableCell>
                  <TableCell className="text-right font-medium">{project.status}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No projects yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
