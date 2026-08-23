import { SUPPORT_EMAIL } from "@/lib/site";

/**
 * The checkout overlay itself has no room for a seller's dispute/refund
 * notice, so this runs right above the button that opens it instead -
 * standard practice payment processors recommend, and the paper trail that
 * backs a chargeback dispute if one ever comes in.
 */
export function PaymentDisclaimer() {
  return (
    <p className="text-xs text-slate">
      By completing this purchase, you confirm that you have reviewed the listing and pricing above and authorize
      the payment. If you have any issue with your purchase, please contact us at{" "}
      <a href={`mailto:${SUPPORT_EMAIL}`} className="underline hover:text-green">
        {SUPPORT_EMAIL}
      </a>{" "}
      before initiating a payment dispute or chargeback.
    </p>
  );
}
