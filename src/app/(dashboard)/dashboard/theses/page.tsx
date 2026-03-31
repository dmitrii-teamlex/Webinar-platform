"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

export default function ThesesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Theses</h1>
        <p className="text-muted-foreground">
          Core thesis ideas for the webinar — reviewed and approved before generation
        </p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="size-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">
            Select a webinar to view and manage its theses
          </p>
          <p className="text-sm text-muted-foreground">
            Theses are generated from source materials and must be approved
            before artifact generation begins.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
