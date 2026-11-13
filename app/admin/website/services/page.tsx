"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  MdOutlineArticle,
  MdOutlineDelete,
  MdOutlineEdit,
  MdOutlineRefresh,
  MdOutlineVisibility,
} from "react-icons/md";
import { fetcher } from "@/lib/swr-config";
import { api } from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import ImageUpload from "@/app/components/UI/ImageUpload";
import {
  Field,
  FormEditor,
  inputCls,
  RichList,
} from "@/app/components/UI/SectionEditors";

interface City {
  id: number;
  name: string;
  state: string | null;
}

interface ServiceCard {
  title: string;
  vehicleSlug: string;
  description: string;
  image: string;
  imagePublicId: string;
  imageAlt: string;
}

interface OurServicesContent {
  eyebrow: string;
  title: string;
  description: string;
  cards: ServiceCard[];
}

interface ServiceRow {
  id: number;
  vehicle_slug: string;
  meta: Record<string, unknown> | null;
  sections?: Record<string, unknown> | null;
  status: "draft" | "published" | "archived";
  sort_order: number;
  updated_at: string;
}

interface ServiceDetailResponse {
  vehicle: ServiceRow;
}

interface ServiceCardEntry {
  definition: ServiceDefinition;
  row: ServiceRow | undefined;
  detailData: ServiceDetailResponse | undefined;
  detailLoading: boolean;
  detailError: Error | undefined;
  storedService: ServiceRow | undefined;
  content: OurServicesContent;
  image: string;
}

interface WildlifeAnimal {
  name: string;
  icon: string;
}

interface SafariZone {
  name: string;
  image: string;
  imagePublicId: string;
  imageAlt: string;
  distance: string;
  duration: string;
  best: string;
  description: string;
  href: string;
}

interface SafariTime {
  start: string;
  end: string;
  startH: string;
  endH: string;
  distance: string;
  capacity: string;
  perPerson: string;
  full: string;
}

interface SafariTypeEntry {
  id: string;
  name: string;
  icon: string;
  fullLabel: string;
  morning: SafariTime;
  evening: SafariTime;
}

interface SafariPlatform {
  initials: string;
  title: string;
  description: string;
  link: string;
}

interface Resort {
  name: string;
  type: string;
  distance: string;
  images: string[];
  tags: string[];
  price: string;
  category: string;
}

interface TouristAttraction {
  name: string;
  image: string;
  imagePublicId: string;
  imageAlt: string;
  description: string;
}

interface DoDhamHotel {
  id?: number | string;
  name: string;
  location: string;
  hotelCount: string;
  image: string;
  imagePublicId: string;
  imageAlt: string;
  description: string;
}

interface VehiclePackageRow {
  vehicle: string;
  layout: string;
  charDham: string;
  doDham: string;
  amenities: string;
}

interface TourPackageDescription {
  title?: string;
  detail: string;
}

interface DoDhamTourCard {
  id?: number | string;
  name: string;
  place: string;
  description: TourPackageDescription[];
  images: string[];
}

interface PilgrimagePlace {
  name: string;
  description: string;
  image: string;
  imagePublicId?: string;
  imageAlt: string;
}

const EMPTY_CITIES: City[] = [];
const EMPTY_SERVICES: ServiceRow[] = [];

const JIM_CORBETT_SECTIONS = [
  { key: "ourservices", label: "Our Services" },
  { key: "hero", label: "Hero" },
  { key: "about", label: "About" },
  { key: "howitworks", label: "How It Works" },
  { key: "groupsize", label: "Vehicle For Every Group Size" },
  { key: "occasion", label: "Vehicle For Every Occasion" },
  { key: "aboutservice", label: "About Service" },
  { key: "wildlife", label: "Wildlife" },
  { key: "safarizones", label: "Safari Zones" },
  { key: "safaritypes", label: "Safari Types" },
  { key: "safariplatforms", label: "Safari Platforms" },
  { key: "resortguide", label: "Resort Guide" },
  { key: "touristattractions", label: "Tourist Attractions" },
  { key: "whychoose", label: "Why Choose Urban Cruise" },
  { key: "testimonials", label: "Testimonial" },
  { key: "faq", label: "FAQs" },
  { key: "servicelocations", label: "Vehicle Rental Service In India" },
  { key: "partners", label: "Our Trusted Partner" },
] as const;

const DO_DHAM_SECTIONS = [
  { key: "hero", label: "Hero" },
  { key: "about", label: "About" },
  { key: "howitworks", label: "How It Works" },
  { key: "groupsize", label: "Vehicle For Every Group Size" },
  { key: "occasion", label: "Vehicle For Every Occasion" },
  { key: "hotels", label: "Hotels" },
  { key: "vehiclepackage", label: "Vehicle Package" },
  { key: "dodhampackages", label: "Do Dham Yatra Packages Card" },
  {
    key: "majorstartingpoints",
    label: "Major Starting Point of the Do Dham Yatra Card",
  },
  { key: "othertourpackages", label: "Other Tour Packages Card" },
  { key: "whychoose", label: "Why Choose Urban Cruise" },
  { key: "testimonials", label: "Testimonial" },
  { key: "faq", label: "FAQs" },
  { key: "servicelocations", label: "Vehicle Rental Service In India" },
  { key: "partners", label: "Our Trusted Partner" },
] as const;

const CHAR_DHAM_SECTIONS = [
  { key: "hero", label: "Hero" },
  { key: "about", label: "About" },
  { key: "howitworks", label: "How It Works" },
  { key: "groupsize", label: "Vehicle For Every Group Size" },
  { key: "occasion", label: "Vehicle For Every Occasion" },
  { key: "hotels", label: "Hotels" },
  { key: "chardhampackages", label: "Char Dham Page Sections" },
  { key: "aboutservice", label: "About Service" },
  { key: "safarizones", label: "Safari Zones" },
  { key: "whychoose", label: "Why Choose Urban Cruise" },
  { key: "testimonials", label: "Testimonial" },
  { key: "faq", label: "FAQs" },
  { key: "servicelocations", label: "Vehicle Rental Service In India" },
  { key: "partners", label: "Our Trusted Partner" },
] as const;

const PILGRIMAGE_SECTIONS = [
  { key: "hero", label: "Hero" },
  { key: "about", label: "About" },
  { key: "howitworks", label: "How It Works" },
  { key: "groupsize", label: "Vehicle For Every Group Size" },
  { key: "occasion", label: "Vehicle For Every Occasion" },
  { key: "pilgrimagepackages", label: "Pilgrimage Page Sections" },
  { key: "places", label: "Places Card" },
  { key: "whychoose", label: "Why Choose Urban Cruise" },
  { key: "testimonials", label: "Testimonial" },
  { key: "faq", label: "FAQs" },
  { key: "servicelocations", label: "Vehicle Rental Service In India" },
  { key: "partners", label: "Our Trusted Partner" },
] as const;

const DEFAULT_CONTENT: OurServicesContent = {
  eyebrow: "Jim Corbett Vehicle Rental",
  title: "Our Services",
  description:
    "Choose the right vehicle for your Jim Corbett trip, from comfortable cars to spacious group travel.",
  cards: [
    {
      title: "Car & SUVs",
      vehicleSlug: "car-suvs",
      description: "Private cars and SUVs for comfortable journeys to Jim Corbett.",
      image: "/images/vehicleforeverygroupsize/7.jpeg",
      imagePublicId: "",
      imageAlt: "Car and SUV rental for a Jim Corbett trip",
    },
    {
      title: "Tempo Traveller",
      vehicleSlug: "tempo-traveller",
      description: "Roomy, comfortable travel for families and small groups.",
      image: "/images/vehicleforeverygroupsize/8.jpeg",
      imagePublicId: "",
      imageAlt: "Tempo Traveller for group travel to Jim Corbett",
    },
    {
      title: "Luxury Bus",
      vehicleSlug: "luxury-bus",
      description: "Spacious bus travel for larger groups visiting Jim Corbett.",
      image: "/images/vehicleforeverygroupsize/9.jpeg",
      imagePublicId: "",
      imageAlt: "Luxury bus for group travel to Jim Corbett",
    },
  ],
};

const DO_DHAM_DEFAULT_CONTENT: OurServicesContent = {
  eyebrow: "Do Dham Yatra",
  title: "Do Dham Yatra",
  description:
    "Manage the Do Dham Yatra page content shown on the Urban Cruise website.",
  cards: [],
};

const CHAR_DHAM_DEFAULT_CONTENT: OurServicesContent = {
  eyebrow: "Char Dham Yatra",
  title: "Char Dham Yatra",
  description:
    "Manage the Char Dham Yatra page content shown on the Urban Cruise website.",
  cards: [],
};

const PILGRIMAGE_DEFAULT_CONTENT: OurServicesContent = {
  eyebrow: "Pilgrimage Vehicle Rental",
  title: "Pilgrimage Travel",
  description:
    "Manage the Pilgrimage Travel page content shown on the Urban Cruise website.",
  cards: [],
};

interface ServiceDefinition {
  slug: string;
  title: string;
  sections: readonly { key: string; label: string }[];
  defaultContent: OurServicesContent;
}

const JIM_CORBETT_SERVICE: ServiceDefinition = {
  slug: "jim-corbett",
  title: "Jim Corbett",
  sections: JIM_CORBETT_SECTIONS,
  defaultContent: DEFAULT_CONTENT,
};

const DO_DHAM_SERVICE: ServiceDefinition = {
  slug: "do-dham",
  title: "Do Dham Yatra",
  sections: DO_DHAM_SECTIONS,
  defaultContent: DO_DHAM_DEFAULT_CONTENT,
};

const CHAR_DHAM_SERVICE: ServiceDefinition = {
  slug: "char-dham",
  title: "Char Dham Yatra",
  sections: CHAR_DHAM_SECTIONS,
  defaultContent: CHAR_DHAM_DEFAULT_CONTENT,
};

const PILGRIMAGE_SERVICE: ServiceDefinition = {
  slug: "pilgrimage",
  title: "Pilgrimage Travel",
  sections: PILGRIMAGE_SECTIONS,
  defaultContent: PILGRIMAGE_DEFAULT_CONTENT,
};

const SERVICE_OPTIONS = [
  JIM_CORBETT_SERVICE,
  DO_DHAM_SERVICE,
  CHAR_DHAM_SERVICE,
  PILGRIMAGE_SERVICE,
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeContent(
  value: unknown,
  fallback: OurServicesContent,
): OurServicesContent {
  if (!isRecord(value)) return fallback;

  const cards = Array.isArray(value.cards)
    ? value.cards.flatMap((card): ServiceCard[] => {
        if (!isRecord(card)) return [];
        return [
          {
            title: readText(card.title),
            vehicleSlug: readText(card.vehicleSlug, "car-suvs"),
            description: readText(card.description),
            image: readText(card.image),
            imagePublicId: readText(card.imagePublicId),
            imageAlt: readText(card.imageAlt),
          },
        ];
      })
    : fallback.cards;

  return {
    eyebrow: readText(value.eyebrow, fallback.eyebrow),
    title: readText(value.title, fallback.title),
    description: readText(value.description, fallback.description),
    cards,
  };
}

export default function WebsiteServicesPage() {
  const { user, hasCityPermission } = useAuth();
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [selectedServiceSlug, setSelectedServiceSlug] = useState("jim-corbett");
  const [editing, setEditing] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [draftSections, setDraftSections] = useState<Record<string, unknown>>(
    {},
  );
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [draftStatus, setDraftStatus] = useState<
    "draft" | "published" | "archived"
  >("draft");

  const {
    data: citiesData,
    isLoading: citiesLoading,
    error: citiesError,
  } = useSWR<{ cities: City[] }>("/api/admin/cities?active=true", fetcher);
  const allCities = citiesData?.cities ?? EMPTY_CITIES;

  const cities = useMemo(() => {
    if (!user) return [];
    if (user.roles?.includes("admin")) return allCities;
    const allowedIds = new Set((user.cities || []).map((city) => city.id));
    return allCities.filter((city) => allowedIds.has(city.id));
  }, [allCities, user]);

  const activeCityId =
    selectedCityId && cities.some((city) => city.id === selectedCityId)
      ? selectedCityId
      : (cities[0]?.id ?? null);
  const service =
    SERVICE_OPTIONS.find((option) => option.slug === selectedServiceSlug) ??
    JIM_CORBETT_SERVICE;
  const hasAccess = hasCityPermission("urbancruise.vehicles.view", activeCityId);

  const listKey =
    activeCityId && hasAccess
      ? `/api/admin/site-content/vehicles?city_id=${activeCityId}`
      : null;
  const {
    data,
    isLoading: servicesLoading,
    error: servicesError,
    mutate,
  } = useSWR<{ vehicles: ServiceRow[] }>(listKey, fetcher);
  const vehicles = data?.vehicles ?? EMPTY_SERVICES;
  const jimCorbettRow = vehicles.find(
    (vehicle) => vehicle.vehicle_slug === JIM_CORBETT_SERVICE.slug,
  );
  const doDhamRow = vehicles.find(
    (vehicle) => vehicle.vehicle_slug === DO_DHAM_SERVICE.slug,
  );
  const charDhamRow = vehicles.find(
    (vehicle) => vehicle.vehicle_slug === CHAR_DHAM_SERVICE.slug,
  );
  const jimCorbettDetailKey =
    activeCityId && jimCorbettRow
      ? `/api/admin/site-content/vehicles?city_id=${activeCityId}&slug=${JIM_CORBETT_SERVICE.slug}`
      : null;
  const {
    data: jimCorbettDetailData,
    isLoading: jimCorbettDetailLoading,
    error: jimCorbettDetailError,
    mutate: mutateJimCorbettDetail,
  } = useSWR<ServiceDetailResponse>(jimCorbettDetailKey, fetcher);
  const doDhamDetailKey =
    activeCityId && doDhamRow
      ? `/api/admin/site-content/vehicles?city_id=${activeCityId}&slug=${DO_DHAM_SERVICE.slug}`
      : null;
  const {
    data: doDhamDetailData,
    isLoading: doDhamDetailLoading,
    error: doDhamDetailError,
    mutate: mutateDoDhamDetail,
  } = useSWR<ServiceDetailResponse>(doDhamDetailKey, fetcher);
  const charDhamDetailKey =
    activeCityId && charDhamRow
      ? `/api/admin/site-content/vehicles?city_id=${activeCityId}&slug=${CHAR_DHAM_SERVICE.slug}`
      : null;
  const {
    data: charDhamDetailData,
    isLoading: charDhamDetailLoading,
    error: charDhamDetailError,
    mutate: mutateCharDhamDetail,
  } = useSWR<ServiceDetailResponse>(charDhamDetailKey, fetcher);
  const pilgrimageRow = vehicles.find(
    (vehicle) => vehicle.vehicle_slug === PILGRIMAGE_SERVICE.slug,
  );
  const pilgrimageDetailKey =
    activeCityId && pilgrimageRow
      ? `/api/admin/site-content/vehicles?city_id=${activeCityId}&slug=${PILGRIMAGE_SERVICE.slug}`
      : null;
  const {
    data: pilgrimageDetailData,
    isLoading: pilgrimageDetailLoading,
    error: pilgrimageDetailError,
    mutate: mutatePilgrimageDetail,
  } = useSWR<ServiceDetailResponse>(pilgrimageDetailKey, fetcher);

  const jimCorbettContent = normalizeContent(
    jimCorbettDetailData?.vehicle.sections?.ourservices,
    JIM_CORBETT_SERVICE.defaultContent,
  );
  const doDhamContent = normalizeContent(
    doDhamDetailData?.vehicle.sections?.ourservices,
    DO_DHAM_SERVICE.defaultContent,
  );
  const charDhamContent = normalizeContent(
    charDhamDetailData?.vehicle.sections?.ourservices,
    CHAR_DHAM_SERVICE.defaultContent,
  );
  const pilgrimageContent = normalizeContent(
    pilgrimageDetailData?.vehicle.sections?.ourservices,
    PILGRIMAGE_SERVICE.defaultContent,
  );
  const serviceEntries: ServiceCardEntry[] = [
    {
      definition: JIM_CORBETT_SERVICE,
      row: jimCorbettRow,
      detailData: jimCorbettDetailData,
      detailLoading: jimCorbettDetailLoading,
      detailError: jimCorbettDetailError,
      storedService: jimCorbettRow
        ? jimCorbettDetailData?.vehicle ?? jimCorbettRow
        : undefined,
      content: jimCorbettContent,
      image:
        jimCorbettContent.cards[0]?.image ||
        JIM_CORBETT_SERVICE.defaultContent.cards[0]?.image ||
        "",
    },
    {
      definition: DO_DHAM_SERVICE,
      row: doDhamRow,
      detailData: doDhamDetailData,
      detailLoading: doDhamDetailLoading,
      detailError: doDhamDetailError,
      storedService: doDhamRow
        ? doDhamDetailData?.vehicle ?? doDhamRow
        : undefined,
      content: doDhamContent,
      image:
        doDhamContent.cards[0]?.image ||
        (isRecord(doDhamDetailData?.vehicle.sections?.hero)
          ? readText(doDhamDetailData?.vehicle.sections?.hero.backgroundImage)
          : ""),
    },
    {
      definition: CHAR_DHAM_SERVICE,
      row: charDhamRow,
      detailData: charDhamDetailData,
      detailLoading: charDhamDetailLoading,
      detailError: charDhamDetailError,
      storedService: charDhamRow
        ? charDhamDetailData?.vehicle ?? charDhamRow
        : undefined,
      content: charDhamContent,
      image:
        charDhamContent.cards[0]?.image ||
        (isRecord(charDhamDetailData?.vehicle.sections?.hero)
          ? readText(charDhamDetailData?.vehicle.sections?.hero.backgroundImage)
          : ""),
    },
    {
      definition: PILGRIMAGE_SERVICE,
      row: pilgrimageRow,
      detailData: pilgrimageDetailData,
      detailLoading: pilgrimageDetailLoading,
      detailError: pilgrimageDetailError,
      storedService: pilgrimageRow
        ? pilgrimageDetailData?.vehicle ?? pilgrimageRow
        : undefined,
      content: pilgrimageContent,
      image:
        pilgrimageContent.cards[0]?.image ||
        (isRecord(pilgrimageDetailData?.vehicle.sections?.hero)
          ? readText(
              pilgrimageDetailData?.vehicle.sections?.hero.backgroundImage,
            )
          : ""),
    },
  ];
  const selectedEntry =
    serviceEntries.find(
      (entry) => entry.definition.slug === selectedServiceSlug,
    ) ?? serviceEntries[0];
  const row = selectedEntry.row;
  const detailError =
    serviceEntries.find((entry) => entry.detailError)?.detailError;
  const storedService = selectedEntry.storedService;
  const content = selectedEntry.content;

  const openEditor = (entry: ServiceCardEntry) => {
    if (
      entry.row &&
      (entry.detailLoading || entry.detailError || !entry.detailData)
    ) {
      if (entry.detailError) {
        setError(
          entry.detailError instanceof Error
            ? entry.detailError.message
            : "Failed to load service content",
        );
      }
      return;
    }
    setSelectedServiceSlug(entry.definition.slug);
    setError("");
    setDraftSections(entry.storedService?.sections ?? {});
    setActiveSection("hero");
    setDraftStatus(entry.row?.status ?? "draft");
    setEditing(true);
  };

  const handleSave = async () => {
    if (!activeCityId) return;
    setSaving(true);
    setError("");
    try {
      await api("/api/admin/site-content/vehicles", {
        method: "PUT",
        body: {
          cityId: activeCityId,
          vehicleSlug: service.slug,
          meta: {
            ...(storedService?.meta ?? {}),
            title: service.title,
          },
          sections: {
            ...(storedService?.sections ?? {}),
            ...draftSections,
          },
          status: draftStatus,
          sortOrder: row?.sort_order ?? 0,
        },
      });
      await mutate();
      if (row) {
        if (service.slug === "do-dham") {
          await mutateDoDhamDetail();
        } else if (service.slug === "char-dham") {
          await mutateCharDhamDetail();
        } else if (service.slug === "pilgrimage") {
          await mutatePilgrimageDetail();
        } else {
          await mutateJimCorbettDetail();
        }
      }
      setEditing(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save service",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry: ServiceCardEntry) => {
    if (!activeCityId || !entry.row) return;
    if (
      !window.confirm(
        `Delete the ${entry.definition.title} content for this city?`,
      )
    )
      return;
    setDeleting(true);
    setError("");
    try {
      await api(
        `/api/admin/site-content/vehicles?city_id=${activeCityId}&slug=${entry.definition.slug}`,
        { method: "DELETE" },
      );
      await mutate();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete service",
      );
    } finally {
      setDeleting(false);
    }
  };

  const isLoading =
    citiesLoading ||
    servicesLoading ||
    serviceEntries.some((entry) => entry.detailLoading);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900">
            <MdOutlineArticle className="h-8 w-8 text-teal-600" />
            Our Services
          </h1>
          <p className="mt-1 text-slate-500">
            Manage service content shown on the public website
          </p>
        </div>
        <button
          type="button"
          onClick={() => void mutate()}
          disabled={!activeCityId || isLoading}
          aria-label="Refresh services"
          className="rounded-lg border border-slate-200 p-3 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          <MdOutlineRefresh className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          City:
        </span>
        {cities.map((city) => (
          <button
            type="button"
            key={city.id}
            onClick={() => setSelectedCityId(city.id)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              city.id === activeCityId
                ? "border-teal-600 bg-teal-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-teal-300"
            }`}
          >
            {city.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[0, 1].map((item) => (
            <div
              key={item}
              className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      ) : citiesError || servicesError || detailError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Failed to load service content.{" "}
          {citiesError instanceof Error
            ? citiesError.message
            : servicesError instanceof Error
              ? servicesError.message
              : detailError instanceof Error
                ? detailError.message
                : ""}
        </div>
      ) : !activeCityId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No city access is available for your account.
        </div>
      ) : !hasAccess ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-800">
          You do not have permission to manage website services for this city.
        </div>
      ) : error && !editing ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {serviceEntries.map((entry) => (
            <article
              key={entry.definition.slug}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex h-48 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                {entry.image ? (
                  <img
                    src={entry.image}
                    alt={entry.content.title || entry.definition.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <MdOutlineArticle className="h-12 w-12 text-slate-300" />
                )}
              </div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {entry.definition.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    {entry.definition.slug}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    entry.row?.status === "published"
                      ? "bg-teal-50 text-teal-700"
                      : entry.row?.status === "archived"
                        ? "bg-slate-100 text-slate-500"
                        : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {entry.row?.status ?? "draft"}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-500">
                {entry.content.description}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {entry.row?.updated_at
                  ? `Updated ${new Date(entry.row.updated_at).toLocaleDateString()}`
                  : "Not configured"}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedServiceSlug(entry.definition.slug);
                    setPreviewing(true);
                  }}
                  disabled={entry.detailLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <MdOutlineVisibility />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => openEditor(entry)}
                  disabled={
                    entry.detailLoading || Boolean(entry.detailError)
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-teal-200 px-3 py-2 text-sm text-teal-700 hover:bg-teal-50"
                >
                  <MdOutlineEdit />
                  Edit
                </button>
                {entry.row && (
                  <button
                    type="button"
                    onClick={() => void handleDelete(entry)}
                    disabled={deleting}
                    aria-label={`Delete ${entry.definition.title} service content`}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <MdOutlineDelete />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <ServiceEditor
          sections={draftSections}
          serviceSlug={service.slug}
          serviceTitle={service.title}
          sectionOptions={service.sections}
          activeSection={activeSection}
          status={draftStatus}
          error={error}
          saving={saving}
          onChange={setDraftSections}
          onSectionChange={setActiveSection}
          onStatusChange={setDraftStatus}
          onClose={() => setEditing(false)}
          onSave={() => void handleSave()}
        />
      )}

      {previewing && (
        <PreviewModal content={content} onClose={() => setPreviewing(false)} />
      )}
    </div>
  );
}

function ServiceEditor({
  sections,
  serviceSlug,
  serviceTitle,
  sectionOptions,
  activeSection,
  status,
  error,
  saving,
  onChange,
  onSectionChange,
  onStatusChange,
  onClose,
  onSave,
}: {
  sections: Record<string, unknown>;
  serviceSlug: string;
  serviceTitle: string;
  sectionOptions: readonly { key: string; label: string }[];
  activeSection: string;
  status: "draft" | "published" | "archived";
  error: string;
  saving: boolean;
  onChange: (sections: Record<string, unknown>) => void;
  onSectionChange: (section: string) => void;
  onStatusChange: (status: "draft" | "published" | "archived") => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const currentSection = sectionOptions.find(
    (section) => section.key === activeSection,
  );
  const [hasInvalidSection, setHasInvalidSection] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {serviceTitle}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Edit website sections for the {serviceTitle} page
            </p>
          </div>
          <select
            value={status}
            onChange={(event) =>
              onStatusChange(
                event.target.value as "draft" | "published" | "archived",
              )
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </header>

        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center">
          <label
            htmlFor="service-section-select"
            className="text-xs font-semibold uppercase tracking-wider text-slate-500 sm:w-24"
          >
            Section
          </label>
          <select
            id="service-section-select"
            value={activeSection}
            onChange={(event) => {
              setHasInvalidSection(false);
              onSectionChange(event.target.value);
            }}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {sectionOptions.map((section) => (
              <option key={section.key} value={section.key}>
                {section.label}
              </option>
            ))}
          </select>
        </div>

        <main className="flex-1 space-y-6 overflow-auto p-6">
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="text-xs text-slate-400">
            Editing:{" "}
            <span className="rounded border border-teal-200 bg-teal-50 px-2 py-1 font-medium text-teal-700">
              {currentSection?.label ?? activeSection}
            </span>
          </div>
          <ServiceSectionEditor
            serviceSlug={serviceSlug}
            key={activeSection}
            sectionKey={activeSection}
            value={sections[activeSection] ?? {}}
            onValidityChange={setHasInvalidSection}
            onChange={(value) =>
              onChange({ ...sections, [activeSection]: value })
            }
          />
        </main>

        <footer className="flex justify-end gap-2 border-t border-slate-200 p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || hasInvalidSection}
            className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : hasInvalidSection
                ? "Fix JSON errors to save"
                : "Save"}
          </button>
        </footer>
      </div>
    </div>
  );
}

const FORM_EDITOR_SECTIONS = new Set([
  "hero",
  "about",
  "howitworks",
  "groupsize",
  "occasion",
  "whychoose",
  "testimonials",
  "faq",
  "servicelocations",
  "partners",
]);

const EMPTY_SAFARI_TIME: SafariTime = {
  start: "",
  end: "",
  startH: "",
  endH: "",
  distance: "",
  capacity: "",
  perPerson: "",
  full: "",
};

function readArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputCls}
        placeholder={placeholder}
      />
    </Field>
  );
}

function SectionHeadingFields({
  value,
  onChange,
  eyebrowPlaceholder,
  titlePlaceholder,
  subtitlePlaceholder,
}: {
  value: Record<string, unknown>;
  onChange: (value: unknown) => void;
  eyebrowPlaceholder: string;
  titlePlaceholder: string;
  subtitlePlaceholder: string;
}) {
  const update = (key: string, next: string) =>
    onChange({ ...value, [key]: next });

  return (
    <div className="space-y-4">
      <TextInput
        label="Eyebrow"
        value={readText(value.eyebrow)}
        onChange={(eyebrow) => update("eyebrow", eyebrow)}
        placeholder={eyebrowPlaceholder}
      />
      <TextInput
        label="Title"
        value={readText(value.title)}
        onChange={(title) => update("title", title)}
        placeholder={titlePlaceholder}
      />
      <TextInput
        label="Subtitle"
        value={readText(value.subtitle)}
        onChange={(subtitle) => update("subtitle", subtitle)}
        placeholder={subtitlePlaceholder}
      />
    </div>
  );
}

function SafariTimeEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: SafariTime;
  onChange: (value: SafariTime) => void;
}) {
  const update = (key: keyof SafariTime, next: string) =>
    onChange({ ...value, [key]: next });

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h5 className="text-sm font-semibold text-slate-800">{label}</h5>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextInput
          label="Start Time"
          value={value.start}
          onChange={(next) => update("start", next)}
          placeholder="6:00 AM"
        />
        <TextInput
          label="End Time"
          value={value.end}
          onChange={(next) => update("end", next)}
          placeholder="10:00 AM"
        />
        <TextInput
          label="Start Hour (24-hour number)"
          value={value.startH}
          onChange={(next) => update("startH", next)}
          placeholder="6"
        />
        <TextInput
          label="End Hour (24-hour number)"
          value={value.endH}
          onChange={(next) => update("endH", next)}
          placeholder="10"
        />
        <TextInput
          label="Distance"
          value={value.distance}
          onChange={(next) => update("distance", next)}
          placeholder="25–40 km"
        />
        <TextInput
          label="Capacity"
          value={value.capacity}
          onChange={(next) => update("capacity", next)}
          placeholder="6 persons"
        />
        <TextInput
          label="Price per Person"
          value={value.perPerson}
          onChange={(next) => update("perPerson", next)}
          placeholder="₹1200 – 1500"
        />
        <TextInput
          label="Full Vehicle Price"
          value={value.full}
          onChange={(next) => update("full", next)}
          placeholder="₹7000 – 7500"
        />
      </div>
    </div>
  );
}

function ServiceSectionEditor({
  serviceSlug,
  sectionKey,
  value,
  onValidityChange,
  onChange,
}: {
  serviceSlug: string;
  sectionKey: string;
  value: unknown;
  onValidityChange: (valid: boolean) => void;
  onChange: (value: unknown) => void;
}) {
  if (serviceSlug === "do-dham") {
    const section = isRecord(value) ? value : {};

    if (sectionKey === "hotels") {
      return <DoDhamHotelsEditor section={section} onChange={onChange} />;
    }

    if (sectionKey === "vehiclepackage") {
      return <VehiclePackageEditor section={section} onChange={onChange} />;
    }

    if (
      sectionKey === "dodhampackages" ||
      sectionKey === "majorstartingpoints" ||
      sectionKey === "othertourpackages"
    ) {
      return (
        <DoDhamCardSectionEditor
          sectionKey={sectionKey}
          section={section}
          onChange={onChange}
        />
      );
    }

    if (FORM_EDITOR_SECTIONS.has(sectionKey)) {
      return (
        <FormEditor
          sectionKey={sectionKey}
          value={section}
          onChange={onChange}
        />
      );
    }

    return (
      <JsonSectionEditor
        sectionKey={sectionKey}
        value={value}
        onValidityChange={onValidityChange}
        onChange={onChange}
      />
    );
  }

  if (serviceSlug === "char-dham") {
    const section = isRecord(value) ? value : {};

    if (sectionKey === "hotels") {
      return <DoDhamHotelsEditor section={section} onChange={onChange} />;
    }

    if (sectionKey === "chardhampackages") {
      return (
        <DoDhamCardSectionEditor
          sectionKey={sectionKey}
          section={section}
          onChange={onChange}
        />
      );
    }

  }

  if (serviceSlug === "pilgrimage" && sectionKey === "pilgrimagepackages") {
    return (
      <DoDhamCardSectionEditor
        sectionKey={sectionKey}
        section={isRecord(value) ? value : {}}
        onChange={onChange}
      />
    );
  }

  if (serviceSlug === "pilgrimage" && sectionKey === "places") {
    return (
      <PilgrimagePlacesEditor
        section={isRecord(value) ? value : {}}
        onChange={onChange}
      />
    );
  }

  if (sectionKey === "ourservices") {
    const section = isRecord(value) ? value : {};
    return (
      <div className="space-y-5">
        <SectionHeadingFields
          value={section}
          onChange={onChange}
          eyebrowPlaceholder="Jim Corbett Vehicle Rental"
          titlePlaceholder="Our Services"
          subtitlePlaceholder="Choose the right vehicle for your trip"
        />
        <Field label="Description">
          <textarea
            value={readText(section.description)}
            onChange={(event) =>
              onChange({ ...section, description: event.target.value })
            }
            className={inputCls}
            rows={3}
          />
        </Field>
        <RichList<ServiceCard>
          label="Service Cards"
          items={readArray<ServiceCard>(section.cards)}
          onChange={(cards) => onChange({ ...section, cards })}
          emptyItem={{
            title: "",
            vehicleSlug: "car-suvs",
            description: "",
            image: "",
            imagePublicId: "",
            imageAlt: "",
          }}
          renderItem={(card, updateCard) => (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput
                  label="Card Title"
                  value={card.title}
                  onChange={(title) => updateCard({ ...card, title })}
                  placeholder="Car & SUVs"
                />
                <TextInput
                  label="Vehicle Slug"
                  value={card.vehicleSlug}
                  onChange={(vehicleSlug) =>
                    updateCard({ ...card, vehicleSlug })
                  }
                  placeholder="car-suvs"
                />
              </div>
              <Field label="Description">
                <textarea
                  value={card.description}
                  onChange={(event) =>
                    updateCard({ ...card, description: event.target.value })
                  }
                  className={inputCls}
                  rows={3}
                />
              </Field>
              <ImageUpload
                label="Card Image"
                value={card.image || null}
                publicId={card.imagePublicId || null}
                onChange={(image, imagePublicId) =>
                  updateCard({
                    ...card,
                    image: image || "",
                    imagePublicId: imagePublicId || "",
                  })
                }
                scope="general"
                aspect="16 / 10"
              />
              <TextInput
                label="Image Alt Text"
                value={card.imageAlt}
                onChange={(imageAlt) => updateCard({ ...card, imageAlt })}
              />
            </div>
          )}
        />
      </div>
    );
  }

  if (FORM_EDITOR_SECTIONS.has(sectionKey)) {
    return (
      <FormEditor
        sectionKey={sectionKey}
        value={value}
        onChange={onChange}
      />
    );
  }

  if (sectionKey === "aboutservice") {
    const section = isRecord(value) ? value : {};
    const paragraphs = Array.isArray(section.paragraphs)
      ? section.paragraphs.filter(
          (paragraph): paragraph is string => typeof paragraph === "string",
        )
      : [];
    const update = (key: string, next: unknown) =>
      onChange({ ...section, [key]: next });

    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow">
            <input
              value={readText(section.eyebrow)}
              onChange={(event) => update("eyebrow", event.target.value)}
              className={inputCls}
              placeholder="About Jim Corbett"
            />
          </Field>
          <Field label="Title">
            <input
              value={readText(section.title)}
              onChange={(event) => update("title", event.target.value)}
              className={inputCls}
              placeholder="Jim Corbett National Park"
            />
          </Field>
        </div>
        <Field label="Tagline">
          <input
            value={readText(section.tagline)}
            onChange={(event) => update("tagline", event.target.value)}
            className={inputCls}
            placeholder="Your Journey, Our Passion"
          />
        </Field>
        <ImageUpload
          label="Section Image"
          value={readText(section.imageUrl) || null}
          publicId={readText(section.imagePublicId) || null}
          onChange={(url, publicId) => {
            onChange({
              ...section,
              imageUrl: url || "",
              imagePublicId: publicId || "",
            });
          }}
          scope="general"
          aspect="16 / 9"
        />
        <RichList<string>
          label="Paragraphs"
          items={paragraphs}
          onChange={(items) => update("paragraphs", items)}
          emptyItem=""
          renderItem={(paragraph, updateParagraph) => (
            <textarea
              value={paragraph}
              onChange={(event) => updateParagraph(event.target.value)}
              className={inputCls}
              rows={3}
              placeholder="Write a paragraph..."
            />
          )}
        />
      </div>
    );
  }

  if (sectionKey === "wildlife") {
    const section = isRecord(value) ? value : {};
    return (
      <div className="space-y-5">
        <SectionHeadingFields
          value={section}
          onChange={onChange}
          eyebrowPlaceholder="WILDLIFE"
          titlePlaceholder="Animals Found in Jim Corbett"
          subtitlePlaceholder="Discover the Wild Heart of Jim Corbett"
        />
        <Field label="Description">
          <textarea
            value={readText(section.description)}
            onChange={(event) =>
              onChange({ ...section, description: event.target.value })
            }
            className={inputCls}
            rows={3}
          />
        </Field>
        <RichList<WildlifeAnimal>
          label="Animals"
          items={readArray<WildlifeAnimal>(section.animals)}
          onChange={(animals) => onChange({ ...section, animals })}
          emptyItem={{ name: "", icon: "" }}
          renderItem={(animal, updateAnimal) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput
                label="Animal Name"
                value={animal.name}
                onChange={(name) => updateAnimal({ ...animal, name })}
                placeholder="Bengal Tiger"
              />
              <TextInput
                label="Icon (emoji)"
                value={animal.icon}
                onChange={(icon) => updateAnimal({ ...animal, icon })}
                placeholder="🐯"
              />
            </div>
          )}
        />
      </div>
    );
  }

  if (sectionKey === "safarizones") {
    const section = isRecord(value) ? value : {};
    return (
      <div className="space-y-5">
        <SectionHeadingFields
          value={section}
          onChange={onChange}
          eyebrowPlaceholder={
            serviceSlug === "char-dham"
              ? "EXPLORE THE CHAR DHAM"
              : "EXPLORE JUNGLE SAFARI ZONES"
          }
          titlePlaceholder={
            serviceSlug === "char-dham"
              ? "The Four Sacred Dhams of Uttarakhand"
              : "Jim Corbett National Park, Uttarakhand"
          }
          subtitlePlaceholder={
            serviceSlug === "char-dham"
              ? "Yamunotri, Gangotri, Kedarnath & Badrinath"
              : "Discover the Best Safari Zones in Jim Corbett"
          }
        />
        {serviceSlug === "char-dham" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput
              label="Card Label"
              value={readText(section.cardLabel)}
              onChange={(cardLabel) =>
                onChange({ ...section, cardLabel })
              }
              placeholder="Char Dham"
            />
            <TextInput
              label="Action Label"
              value={readText(section.actionLabel)}
              onChange={(actionLabel) =>
                onChange({ ...section, actionLabel })
              }
              placeholder="Explore Yatra"
            />
          </div>
        )}
        <Field label="Description">
          <textarea
            value={readText(section.description)}
            onChange={(event) =>
              onChange({ ...section, description: event.target.value })
            }
            className={inputCls}
            rows={3}
          />
        </Field>
        <RichList<SafariZone>
          label="Safari Zones"
          items={readArray<SafariZone>(section.zones)}
          onChange={(zones) => onChange({ ...section, zones })}
          emptyItem={{
            name: "",
            image: "",
            imagePublicId: "",
            imageAlt: "",
            distance: "",
            duration: "",
            best: "",
            description: "",
            href: "",
          }}
          renderItem={(zone, updateZone) => (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput
                  label="Zone Name"
                  value={zone.name}
                  onChange={(name) => updateZone({ ...zone, name })}
                />
                <TextInput
                  label="Link"
                  value={zone.href}
                  onChange={(href) => updateZone({ ...zone, href })}
                  placeholder={
                    serviceSlug === "char-dham"
                      ? "/char-dham-yatra-package"
                      : "/safari/dhikala"
                  }
                />
              </div>
              <ImageUpload
                label="Zone Image"
                value={zone.image || null}
                publicId={zone.imagePublicId || null}
                onChange={(image, imagePublicId) =>
                  updateZone({
                    ...zone,
                    image: image || "",
                    imagePublicId: imagePublicId || "",
                  })
                }
                scope="general"
                aspect="4 / 3"
              />
              <TextInput
                label="Image Alt Text"
                value={zone.imageAlt}
                onChange={(imageAlt) => updateZone({ ...zone, imageAlt })}
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <TextInput
                  label="Distance"
                  value={zone.distance}
                  onChange={(distance) => updateZone({ ...zone, distance })}
                  placeholder="30–40 km"
                />
                <TextInput
                  label="Duration"
                  value={zone.duration}
                  onChange={(duration) => updateZone({ ...zone, duration })}
                  placeholder="4–5 hrs"
                />
                <TextInput
                  label="Best For"
                  value={zone.best}
                  onChange={(best) => updateZone({ ...zone, best })}
                  placeholder="Tigers & Elephants"
                />
              </div>
              <Field label="Description">
                <textarea
                  value={zone.description}
                  onChange={(event) =>
                    updateZone({ ...zone, description: event.target.value })
                  }
                  className={inputCls}
                  rows={3}
                />
              </Field>
            </div>
          )}
        />
      </div>
    );
  }

  if (sectionKey === "safaritypes") {
    const section = isRecord(value) ? value : {};
    return (
      <div className="space-y-5">
        <SectionHeadingFields
          value={section}
          onChange={onChange}
          eyebrowPlaceholder="SAFARI GUIDE"
          titlePlaceholder="Types of Safari in Jim Corbett"
          subtitlePlaceholder="Find Your Perfect Jungle Adventure"
        />
        <Field label="Description">
          <textarea
            value={readText(section.description)}
            onChange={(event) =>
              onChange({ ...section, description: event.target.value })
            }
            className={inputCls}
            rows={3}
          />
        </Field>
        <RichList<SafariTypeEntry>
          label="Safari Types"
          items={readArray<SafariTypeEntry>(section.safariTypes)}
          onChange={(safariTypes) => onChange({ ...section, safariTypes })}
          emptyItem={{
            id: "",
            name: "",
            icon: "",
            fullLabel: "",
            morning: EMPTY_SAFARI_TIME,
            evening: EMPTY_SAFARI_TIME,
          }}
          renderItem={(type, updateType) => (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <TextInput
                  label="ID"
                  value={type.id}
                  onChange={(id) => updateType({ ...type, id })}
                  placeholder="jeep"
                />
                <TextInput
                  label="Safari Name"
                  value={type.name}
                  onChange={(name) => updateType({ ...type, name })}
                  placeholder="Jeep Safari"
                />
                <TextInput
                  label="Icon (emoji)"
                  value={type.icon}
                  onChange={(icon) => updateType({ ...type, icon })}
                  placeholder="🚙"
                />
              </div>
              <TextInput
                label="Full Session Label"
                value={type.fullLabel}
                onChange={(fullLabel) => updateType({ ...type, fullLabel })}
                placeholder="Full Jeep"
              />
              {(["morning", "evening"] as const).map((session) => (
                <SafariTimeEditor
                  key={session}
                  label={`${session[0].toUpperCase()}${session.slice(1)} Session`}
                  value={type[session]}
                  onChange={(time) =>
                    updateType({ ...type, [session]: time })
                  }
                />
              ))}
            </div>
          )}
        />
      </div>
    );
  }

  if (sectionKey === "safariplatforms") {
    const section = isRecord(value) ? value : {};
    return (
      <div className="space-y-5">
        <SectionHeadingFields
          value={section}
          onChange={onChange}
          eyebrowPlaceholder="BEST PLATFORM"
          titlePlaceholder="TO BOOK JIM CORBETT SAFARI"
          subtitlePlaceholder="Find a Trusted Platform for Your Safari"
        />
        <Field label="Description">
          <textarea
            value={readText(section.description)}
            onChange={(event) =>
              onChange({ ...section, description: event.target.value })
            }
            className={inputCls}
            rows={3}
          />
        </Field>
        <RichList<SafariPlatform>
          label="Platforms"
          items={readArray<SafariPlatform>(section.platforms)}
          onChange={(platforms) => onChange({ ...section, platforms })}
          emptyItem={{ initials: "", title: "", description: "", link: "" }}
          renderItem={(platform, updatePlatform) => (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput
                  label="Initials"
                  value={platform.initials}
                  onChange={(initials) =>
                    updatePlatform({ ...platform, initials })
                  }
                />
                <TextInput
                  label="Platform Name"
                  value={platform.title}
                  onChange={(title) => updatePlatform({ ...platform, title })}
                />
              </div>
              <Field label="Description">
                <textarea
                  value={platform.description}
                  onChange={(event) =>
                    updatePlatform({
                      ...platform,
                      description: event.target.value,
                    })
                  }
                  className={inputCls}
                  rows={2}
                />
              </Field>
              <TextInput
                label="Website URL"
                value={platform.link}
                onChange={(link) => updatePlatform({ ...platform, link })}
                placeholder="https://example.com"
              />
            </div>
          )}
        />
      </div>
    );
  }

  if (sectionKey === "resortguide") {
    const section = isRecord(value) ? value : {};
    return (
      <div className="space-y-5">
        <SectionHeadingFields
          value={section}
          onChange={onChange}
          eyebrowPlaceholder="RESORT GUIDE"
          titlePlaceholder="Top Resorts Near Jim Corbett National Park"
          subtitlePlaceholder="Find Your Perfect Stay in the Wild"
        />
        <Field label="Description">
          <textarea
            value={readText(section.description)}
            onChange={(event) =>
              onChange({ ...section, description: event.target.value })
            }
            className={inputCls}
            rows={3}
          />
        </Field>
        <Field label="Filters (comma separated)">
          <input
            value={readArray<string>(section.filters).join(", ")}
            onChange={(event) =>
              onChange({
                ...section,
                filters: event.target.value
                  .split(",")
                  .map((filter) => filter.trim())
                  .filter(Boolean),
              })
            }
            className={inputCls}
            placeholder="All, Luxury, Budget, Riverside"
          />
        </Field>
        <RichList<Resort>
          label="Resorts"
          items={readArray<Resort>(section.resorts)}
          onChange={(resorts) => onChange({ ...section, resorts })}
          emptyItem={{
            name: "",
            type: "",
            distance: "",
            images: [],
            tags: [],
            price: "",
            category: "",
          }}
          renderItem={(resort, updateResort) => (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput
                  label="Resort Name"
                  value={resort.name}
                  onChange={(name) => updateResort({ ...resort, name })}
                />
                <TextInput
                  label="Category"
                  value={resort.category}
                  onChange={(category) =>
                    updateResort({ ...resort, category })
                  }
                  placeholder="Luxury"
                />
                <TextInput
                  label="Type / Star Rating"
                  value={resort.type}
                  onChange={(type) => updateResort({ ...resort, type })}
                />
                <TextInput
                  label="Distance from Park"
                  value={resort.distance}
                  onChange={(distance) => updateResort({ ...resort, distance })}
                />
                <TextInput
                  label="Price per Night"
                  value={resort.price}
                  onChange={(price) => updateResort({ ...resort, price })}
                />
                <TextInput
                  label="Tags (comma separated)"
                  value={resort.tags.join(", ")}
                  onChange={(tags) =>
                    updateResort({
                      ...resort,
                      tags: tags
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
              <RichList<string>
                label="Image URLs"
                items={resort.images}
                onChange={(images) => updateResort({ ...resort, images })}
                emptyItem=""
                renderItem={(image, updateImage) => (
                  <TextInput
                    label="Image URL"
                    value={image}
                    onChange={updateImage}
                    placeholder="https://..."
                  />
                )}
              />
            </div>
          )}
        />
      </div>
    );
  }

  if (sectionKey === "touristattractions") {
    const section = isRecord(value) ? value : {};
    return (
      <div className="space-y-5">
        <SectionHeadingFields
          value={section}
          onChange={onChange}
          eyebrowPlaceholder="TOURIST ATTRACTIONS"
          titlePlaceholder="Explore Near Jim Corbett"
          subtitlePlaceholder="Make More of Your Corbett Getaway"
        />
        <Field label="Description">
          <textarea
            value={readText(section.description)}
            onChange={(event) =>
              onChange({ ...section, description: event.target.value })
            }
            className={inputCls}
            rows={3}
          />
        </Field>
        <RichList<TouristAttraction>
          label="Attractions"
          items={readArray<TouristAttraction>(section.attractions)}
          onChange={(attractions) => onChange({ ...section, attractions })}
          emptyItem={{
            name: "",
            image: "",
            imagePublicId: "",
            imageAlt: "",
            description: "",
          }}
          renderItem={(attraction, updateAttraction) => (
            <div className="space-y-4">
              <TextInput
                label="Attraction Name"
                value={attraction.name}
                onChange={(name) => updateAttraction({ ...attraction, name })}
                placeholder="Nainital"
              />
              <ImageUpload
                label="Attraction Image"
                value={attraction.image || null}
                publicId={attraction.imagePublicId || null}
                onChange={(image, imagePublicId) =>
                  updateAttraction({
                    ...attraction,
                    image: image || "",
                    imagePublicId: imagePublicId || "",
                  })
                }
                scope="general"
                aspect="4 / 3"
              />
              <TextInput
                label="Image Alt Text"
                value={attraction.imageAlt}
                onChange={(imageAlt) =>
                  updateAttraction({ ...attraction, imageAlt })
                }
              />
              <Field label="Description">
                <textarea
                  value={attraction.description}
                  onChange={(event) =>
                    updateAttraction({
                      ...attraction,
                      description: event.target.value,
                    })
                  }
                  className={inputCls}
                  rows={3}
                />
              </Field>
            </div>
          )}
        />
      </div>
    );
  }

  return (
    <JsonSectionEditor
      value={value}
      onValidityChange={onValidityChange}
      onChange={onChange}
    />
  );
}

function JsonSectionEditor({
  sectionKey,
  value,
  onValidityChange,
  onChange,
}: {
  sectionKey?: string;
  value: unknown;
  onValidityChange: (valid: boolean) => void;
  onChange: (value: unknown) => void;
}) {
  const [json, setJson] = useState(() => JSON.stringify(value ?? {}, null, 2));
  const [parseError, setParseError] = useState("");
  const sectionHints: Record<string, string> = {
    hotels:
      "Use hotels: [{ name, location, hotelCount, image, imageAlt, description }], plus optional eyebrow, title, subtitle, and description.",
    vehiclepackage:
      "Use vehicles: [{ vehicle, layout, charDham, doDham, amenities }], plus optional eyebrow, title, subtitle, description, and columns labels.",
    dodhampackages:
      "Use cards: [{ id, name, place, description: [{ title, detail }], images: [url] }], plus optional eyebrow, title, subtitle, and description.",
    pilgrimagepackages:
      "Use cards: [{ id, name, place, description: [{ title, detail }], images: [url] }], plus optional eyebrow, title, subtitle, and description.",
    majorstartingpoints:
      "Use cards: [{ id, name, place, description: [{ title, detail }], images: [url] }], plus optional eyebrow, title, subtitle, and description.",
    othertourpackages:
      "Use cards: [{ id, name, place, description: [{ title, detail }], images: [url] }], plus optional eyebrow, title, subtitle, and description.",
  };
  const sectionHint = sectionKey ? sectionHints[sectionKey] : undefined;

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        {sectionHint ??
          "Edit this section's content as JSON. Keep the field names expected by the public page."}
      </p>
      <Field label="Section Content (JSON)">
        <textarea
          value={json}
          onChange={(event) => {
            const nextJson = event.target.value;
            setJson(nextJson);
            try {
              const parsed: unknown = JSON.parse(nextJson);
              if (!isRecord(parsed)) {
                setParseError("Section content must be a JSON object.");
                onValidityChange(false);
                return;
              }
              setParseError("");
              onValidityChange(true);
              onChange(parsed);
            } catch {
              setParseError("Enter valid JSON before saving this section.");
              onValidityChange(false);
            }
          }}
          className={`${inputCls} min-h-80 font-mono text-xs`}
          spellCheck={false}
        />
      </Field>
      {parseError && (
        <p role="alert" className="text-sm text-red-600">
          {parseError}
        </p>
      )}
    </div>
  );
}

function DoDhamHotelsEditor({
  section,
  onChange,
}: {
  section: Record<string, unknown>;
  onChange: (value: unknown) => void;
}) {
  const update = (key: string, value: unknown) =>
    onChange({ ...section, [key]: value });

  return (
    <div className="space-y-5">
      <SectionHeadingFields
        value={section}
        onChange={onChange}
        eyebrowPlaceholder="RECOMMENDED STAYS"
        titlePlaceholder="Hotels for Your Do Dham Yatra"
        subtitlePlaceholder="Comfortable Stays Along Your Journey"
      />
      <Field label="Description">
        <textarea
          value={readText(section.description)}
          onChange={(event) => update("description", event.target.value)}
          className={inputCls}
          rows={3}
        />
      </Field>
      <RichList<DoDhamHotel>
        label="Hotels"
        items={readArray<DoDhamHotel>(section.hotels)}
        onChange={(hotels) => update("hotels", hotels)}
        emptyItem={{
          name: "",
          location: "",
          hotelCount: "",
          image: "",
          imagePublicId: "",
          imageAlt: "",
          description: "",
        }}
        renderItem={(hotel, updateHotel) => (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput
                label="Hotel Card Title"
                value={readText(hotel.name)}
                onChange={(name) => updateHotel({ ...hotel, name })}
                placeholder="Hotels in Badrinath"
              />
              <TextInput
                label="Location"
                value={readText(hotel.location)}
                onChange={(location) => updateHotel({ ...hotel, location })}
                placeholder="Badrinath"
              />
              <TextInput
                label="Hotel Count"
                value={readText(hotel.hotelCount)}
                onChange={(hotelCount) =>
                  updateHotel({ ...hotel, hotelCount })
                }
                placeholder="18+ Hotels"
              />
              <TextInput
                label="Image Alt Text"
                value={readText(hotel.imageAlt)}
                onChange={(imageAlt) => updateHotel({ ...hotel, imageAlt })}
              />
            </div>
            <ImageUpload
              label="Hotel Image"
              value={readText(hotel.image) || null}
              publicId={readText(hotel.imagePublicId) || null}
              onChange={(image, imagePublicId) =>
                updateHotel({
                  ...hotel,
                  image: image || "",
                  imagePublicId: imagePublicId || "",
                })
              }
              scope="general"
              aspect="16 / 10"
            />
            <Field label="Description">
              <textarea
                value={readText(hotel.description)}
                onChange={(event) =>
                  updateHotel({ ...hotel, description: event.target.value })
                }
                className={inputCls}
                rows={3}
              />
            </Field>
          </div>
        )}
      />
    </div>
  );
}

function VehiclePackageEditor({
  section,
  onChange,
}: {
  section: Record<string, unknown>;
  onChange: (value: unknown) => void;
}) {
  const columns = isRecord(section.columns) ? section.columns : {};
  const update = (key: string, value: unknown) =>
    onChange({ ...section, [key]: value });
  const updateColumn = (key: string, value: string) =>
    update("columns", { ...columns, [key]: value });

  return (
    <div className="space-y-5">
      <SectionHeadingFields
        value={section}
        onChange={onChange}
        eyebrowPlaceholder="VEHICLES & PACKAGES"
        titlePlaceholder="Vehicle-wise Package Summary"
        subtitlePlaceholder="Char Dham Yatra & Do Dham Yatra packages"
      />
      <Field label="Description">
        <textarea
          value={readText(section.description)}
          onChange={(event) => update("description", event.target.value)}
          className={inputCls}
          rows={3}
        />
      </Field>
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-700">Table Labels</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput
            label="Vehicle"
            value={readText(columns.vehicle)}
            onChange={(value) => updateColumn("vehicle", value)}
            placeholder="Vehicle"
          />
          <TextInput
            label="Seating Configuration"
            value={readText(columns.layout)}
            onChange={(value) => updateColumn("layout", value)}
            placeholder="Seating Config"
          />
          <TextInput
            label="Char Dham Price"
            value={readText(columns.charDham)}
            onChange={(value) => updateColumn("charDham", value)}
            placeholder="Char Dham (12 Days)"
          />
          <TextInput
            label="Do Dham Price"
            value={readText(columns.doDham)}
            onChange={(value) => updateColumn("doDham", value)}
            placeholder="Do Dham (7 Days)"
          />
          <TextInput
            label="Amenities"
            value={readText(columns.amenities)}
            onChange={(value) => updateColumn("amenities", value)}
            placeholder="Amenities"
          />
          <TextInput
            label="Book Column"
            value={readText(columns.book)}
            onChange={(value) => updateColumn("book", value)}
            placeholder="Book"
          />
          <TextInput
            label="Book Button"
            value={readText(columns.bookButton)}
            onChange={(value) => updateColumn("bookButton", value)}
            placeholder="Book Now"
          />
          <TextInput
            label="Mobile Char Dham Label"
            value={readText(columns.mobileCharDham)}
            onChange={(value) => updateColumn("mobileCharDham", value)}
            placeholder="Char Dham"
          />
          <TextInput
            label="Mobile Do Dham Label"
            value={readText(columns.mobileDoDham)}
            onChange={(value) => updateColumn("mobileDoDham", value)}
            placeholder="Do Dham"
          />
        </div>
      </div>
      <RichList<VehiclePackageRow>
        label="Vehicle Package Rows"
        items={readArray<VehiclePackageRow>(section.vehicles)}
        onChange={(vehicles) => update("vehicles", vehicles)}
        emptyItem={{
          vehicle: "",
          layout: "",
          charDham: "",
          doDham: "",
          amenities: "",
        }}
        renderItem={(vehicle, updateVehicle) => (
          <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
            <TextInput
              label="Vehicle"
              value={readText(vehicle.vehicle)}
              onChange={(value) =>
                updateVehicle({ ...vehicle, vehicle: value })
              }
              placeholder="Tempo Traveller 17 Seater"
            />
            <TextInput
              label="Seating Configuration"
              value={readText(vehicle.layout)}
              onChange={(value) =>
                updateVehicle({ ...vehicle, layout: value })
              }
              placeholder="2x1"
            />
            <TextInput
              label="Char Dham Price"
              value={readText(vehicle.charDham)}
              onChange={(value) =>
                updateVehicle({ ...vehicle, charDham: value })
              }
              placeholder="1,20,000"
            />
            <TextInput
              label="Do Dham Price"
              value={readText(vehicle.doDham)}
              onChange={(value) =>
                updateVehicle({ ...vehicle, doDham: value })
              }
              placeholder="70,000"
            />
            <Field label="Amenities">
              <textarea
                value={readText(vehicle.amenities)}
                onChange={(event) =>
                  updateVehicle({ ...vehicle, amenities: event.target.value })
                }
                className={inputCls}
                rows={2}
              />
            </Field>
          </div>
        )}
      />
    </div>
  );
}

function PilgrimagePlacesEditor({
  section,
  onChange,
}: {
  section: Record<string, unknown>;
  onChange: (value: unknown) => void;
}) {
  const update = (key: string, value: unknown) =>
    onChange({ ...section, [key]: value });

  return (
    <div className="space-y-5">
      <SectionHeadingFields
        value={section}
        onChange={onChange}
        eyebrowPlaceholder="Sacred Places"
        titlePlaceholder="Popular Pilgrimage Places"
        subtitlePlaceholder="Explore Sacred Destinations Across India"
      />
      <Field label="Description">
        <textarea
          value={readText(section.description)}
          onChange={(event) => update("description", event.target.value)}
          className={inputCls}
          rows={3}
        />
      </Field>
      <RichList<PilgrimagePlace>
        label="Places"
        items={readArray<PilgrimagePlace>(section.items)}
        onChange={(items) => update("items", items)}
        emptyItem={{
          name: "",
          description: "",
          image: "",
          imagePublicId: "",
          imageAlt: "",
        }}
        renderItem={(place, updatePlace) => (
          <div className="space-y-4">
            <TextInput
              label="Place Name"
              value={readText(place.name)}
              onChange={(name) => updatePlace({ ...place, name })}
              placeholder="Varanasi"
            />
            <Field label="Description">
              <textarea
                value={readText(place.description)}
                onChange={(event) =>
                  updatePlace({ ...place, description: event.target.value })
                }
                className={inputCls}
                rows={3}
              />
            </Field>
            <ImageUpload
              label="Place Image"
              value={readText(place.image) || null}
              publicId={readText(place.imagePublicId) || null}
              onChange={(image, imagePublicId) =>
                updatePlace({
                  ...place,
                  image: image || "",
                  imagePublicId: imagePublicId || "",
                })
              }
              scope="general"
              aspect="4 / 3"
            />
            <TextInput
              label="Image Alt Text"
              value={readText(place.imageAlt)}
              onChange={(imageAlt) => updatePlace({ ...place, imageAlt })}
              placeholder="Scenic image for a pilgrimage in Varanasi"
            />
          </div>
        )}
      />
    </div>
  );
}

function DoDhamCardSectionEditor({
  sectionKey,
  section,
  onChange,
}: {
  sectionKey: string;
  section: Record<string, unknown>;
  onChange: (value: unknown) => void;
}) {
  const update = (key: string, value: unknown) =>
    onChange({ ...section, [key]: value });
  const heading =
    sectionKey === "pilgrimagepackages"
      ? {
          eyebrow: "PILGRIMAGE PACKAGES",
          title: "Pilgrimage Tour Packages",
          subtitle: "Choose the Right Pilgrimage Package for You",
        }
      : sectionKey === "dodhampackages"
      ? {
          eyebrow: "RECOMMENDED STAY",
          title: "Do Dham Yatra Packages",
          subtitle: "Choose The Right Do Dham Yatra Package For You",
        }
      : sectionKey === "chardhampackages"
        ? {
            eyebrow: "CHAR DHAM PACKAGES",
            title: "Char Dham Yatra Packages",
            subtitle: "Choose the Right Char Dham Yatra Package for You",
          }
        : sectionKey === "majorstartingpoints"
          ? {
              eyebrow: "STARTING POINTS",
              title: "Major Starting Point of the Do Dham Yatra",
              subtitle:
                "Start Your Sacred Journey from Delhi, Haridwar & Major Cities",
            }
          : {
              eyebrow: "OTHER TOUR PACKAGES",
              title: "Other Tour Packages",
              subtitle: "Explore Our Additional Sacred Journeys",
            };

  return (
    <div className="space-y-5">
      <SectionHeadingFields
        value={section}
        onChange={onChange}
        eyebrowPlaceholder={heading.eyebrow}
        titlePlaceholder={heading.title}
        subtitlePlaceholder={heading.subtitle}
      />
      <Field label="Description">
        <textarea
          value={readText(section.description)}
          onChange={(event) => update("description", event.target.value)}
          className={inputCls}
          rows={3}
        />
      </Field>
      <RichList<DoDhamTourCard>
        label="Package Cards"
        items={readArray<DoDhamTourCard>(section.cards)}
        onChange={(cards) => update("cards", cards)}
        emptyItem={{ name: "", place: "", description: [], images: [] }}
        renderItem={(card, updateCard) => (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput
                label="Card Title"
                value={readText(card.name)}
                onChange={(name) => updateCard({ ...card, name })}
                placeholder="Do Dham Yatra from Delhi"
              />
              <TextInput
                label="Place Badge"
                value={readText(card.place)}
                onChange={(place) => updateCard({ ...card, place })}
                placeholder="Delhi"
              />
            </div>
            <RichList<TourPackageDescription>
              label="Card Descriptions"
              items={readArray<TourPackageDescription>(card.description)}
              onChange={(description) =>
                updateCard({ ...card, description })
              }
              emptyItem={{ title: "", detail: "" }}
              renderItem={(item, updateItem) => (
                <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
                  <TextInput
                    label="Description Heading (optional)"
                    value={readText(item.title)}
                    onChange={(title) => updateItem({ ...item, title })}
                    placeholder="Complete 7-8 Day Journey"
                  />
                  <Field label="Description">
                    <textarea
                      value={readText(item.detail)}
                      onChange={(event) =>
                        updateItem({ ...item, detail: event.target.value })
                      }
                      className={inputCls}
                      rows={3}
                    />
                  </Field>
                </div>
              )}
            />
            <RichList<string>
              label="Card Image URLs"
              items={readArray<string>(card.images)}
              onChange={(images) => updateCard({ ...card, images })}
              emptyItem=""
              renderItem={(image, updateImage) => (
                <TextInput
                  label="Image URL"
                  value={readText(image)}
                  onChange={updateImage}
                  placeholder="https://..."
                />
              )}
            />
          </div>
        )}
      />
    </div>
  );
}

function PreviewModal({
  content,
  onClose,
}: {
  content: OurServicesContent;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal-600">
              {content.eyebrow}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {content.title}
            </h2>
            <p className="mt-2 text-sm text-slate-500">{content.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            Close
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.cards.map((card, index) => (
            <article
              key={`${card.vehicleSlug}-${index}`}
              className="overflow-hidden rounded-xl border border-slate-200"
            >
              {card.image && (
                <img
                  src={card.image}
                  alt={card.imageAlt || card.title}
                  className="h-40 w-full object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {card.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
