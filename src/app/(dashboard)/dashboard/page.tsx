import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your webinar funnels and generated artifacts
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/new">
            <Plus className="size-4" />
            New Webinar
          </Link>
        </Button>
      </div>

      {/* Webinar list will be populated from DB */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Webinars</CardTitle>
          <CardDescription>
            Your latest webinar funnel projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No webinars yet. Create your first webinar to get started.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
