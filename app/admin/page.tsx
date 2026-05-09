import { requireAdminAuth } from "@/src/lib/auth";
import { readVehicles } from "@/src/lib/vehicle-store";
import { toggleFeaturedAction, togglePublishedAction, logoutUserAction } from "@/app/admin/actions";
import { AdminDashboardClient } from "@/src/components/AdminDashboardClient";

interface AdminDashboardProps {
  searchParams?: {
    created?: string;
    updated?: string;
    deleted?: string;
  };
}

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

function getNoticeSentinel(searchParams?: AdminDashboardProps["searchParams"]) {
  if (searchParams?.updated === "1") return "__UPDATED__";
  return null;
}

async function getAdminVehicles() {
  try {
    return {
      vehicles: await readVehicles(),
      notice: null,
    };
  } catch (error) {
    console.error("[admin] Failed to load vehicles for dashboard.", error);
    return {
      vehicles: [],
      notice: "__LOAD_FAILED__",
    };
  }
}

export default async function AdminDashboard({ searchParams }: AdminDashboardProps) {
  await requireAdminAuth();
  const { vehicles, notice: loadNotice } = await getAdminVehicles();
  const notice = loadNotice ?? getNoticeSentinel(searchParams);

  const vehicleRows = vehicles.map((v) => ({
    id: v.id,
    tipcarsId: v.tipcarsId,
    title: v.title,
    make: v.make,
    model: v.model,
    location: v.location,
    price: v.price,
    year: v.year,
    mileage: v.mileage,
    published: v.published,
    featured: v.featured,
    imageUrl: v.imageUrl,
  }));

  return (
    <AdminDashboardClient
      vehicles={vehicleRows}
      notice={notice}
      logoutAction={logoutUserAction}
      toggleFeaturedAction={toggleFeaturedAction}
      togglePublishedAction={togglePublishedAction}
    />
  );
}
