export default function BrandedSiteNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7faf8] px-6 text-center">
      <h1 className="text-2xl font-semibold text-[#0f1530]">This business site is not available</h1>
      <p className="mt-3 max-w-md text-[#5e6684]">
        Online booking may be disabled or the link may be incorrect. Contact the business directly if you need help.
      </p>
    </div>
  );
}
