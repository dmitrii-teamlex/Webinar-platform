import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

/** GET /api/artifacts/:id/versions — List all versions of an artifact */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  // TODO: Fetch versions from DB ordered by version desc
  // const versions = await db.query.artifactVersions.findMany({
  //   where: eq(artifactVersions.artifactId, id),
  //   orderBy: desc(artifactVersions.version),
  // });

  return NextResponse.json({
    artifactId: id,
    versions: [],
  });
}
