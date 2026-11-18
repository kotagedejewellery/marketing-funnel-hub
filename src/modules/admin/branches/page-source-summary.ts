export type PageSourceSummaryItem = {
  id: string;
  label: string;
  detail: string;
};

export function getPageSourceSummary({
  now,
  branchIsActive,
  logoPath,
  campaigns,
  gallery,
  activeCtaCount,
  reviewSource,
  reviews,
  faqs,
  inheritsFaqs,
  activeLinkCount,
  activeSectionCount,
}: {
  now: Date;
  branchIsActive: boolean;
  logoPath: string | null;
  campaigns: {
    isActive: boolean;
    activeFrom: Date | null;
    activeUntil: Date | null;
  }[];
  gallery: { isActive: boolean }[];
  activeCtaCount: number;
  reviewSource: {
    isEnabled: boolean;
    minimumRating: number;
    maximumReviews: number;
    displayMode: "automatic" | "manual";
  } | null;
  reviews: {
    isHidden: boolean;
    isSelected: boolean;
    rating: number;
    relativeTimeId: string | null;
    reviewTextId: string | null;
  }[];
  faqs: { isActive: boolean }[];
  inheritsFaqs: boolean;
  activeLinkCount: number;
  activeSectionCount: number;
}): PageSourceSummaryItem[] {
  const eligibleCampaigns = campaigns.filter(
    (campaign) =>
      campaign.isActive &&
      (!campaign.activeFrom || campaign.activeFrom <= now) &&
      (!campaign.activeUntil || campaign.activeUntil >= now),
  );
  const visibleReviews = reviewSource?.isEnabled
    ? reviews
        .filter(
          (review) =>
            !review.isHidden &&
            review.rating >= reviewSource.minimumRating &&
            (reviewSource.displayMode === "automatic" || review.isSelected) &&
            review.relativeTimeId !== null &&
            review.reviewTextId !== null,
        )
        .slice(0, reviewSource.maximumReviews)
    : [];

  return [
    {
      id: "profile",
      label: "Profil & logo",
      detail: logoPath ? "Logo khusus tersedia" : "Ikuti standar KGJ",
    },
    {
      id: "campaign",
      label: "Konten unggulan",
      detail: `${eligibleCampaigns.length} siap tampil`,
    },
    {
      id: "gallery",
      label: "Galeri produk",
      detail: `${gallery.filter((item) => item.isActive).length} aktif`,
    },
    {
      id: "cta",
      label: "CTA WhatsApp",
      detail: branchIsActive
        ? `${activeCtaCount} siap tampil`
        : "Cabang nonaktif",
    },
    {
      id: "reviews",
      label: "Ulasan Google",
      detail: reviewSource?.isEnabled
        ? `${visibleReviews.length} siap tampil`
        : "Tidak ditampilkan",
    },
    {
      id: "faq",
      label: "FAQ",
      detail: `${faqs.filter((item) => item.isActive).length} aktif${inheritsFaqs ? " · template" : ""}`,
    },
    {
      id: "links",
      label: "Tautan & sosial",
      detail: branchIsActive
        ? `${activeLinkCount} siap tampil`
        : "Cabang nonaktif",
    },
    {
      id: "sections",
      label: "Section halaman",
      detail: `${activeSectionCount} aktif`,
    },
  ];
}
