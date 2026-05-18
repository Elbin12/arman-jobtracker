import { Box, Skeleton } from '@mui/material';
import TermsBrandingHeader from '../../components/TermsBrandingHeader';
import { useAccountBranding } from '../../hooks/useAccountBranding';
import { applyCompanyNameToTermsText } from '../../utils/companyProfile';

function TermsAndConditions() {
  const { profile, isLoading, isReady } = useAccountBranding();
  const t = (text) => {
    if (!isReady || !profile.name) return '';
    return applyCompanyNameToTermsText(text, profile.name, profile.abbreviation);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TermsBrandingHeader profile={profile} isLoading={isLoading} />

      <div className="sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r sm:px-8 py-6">
              <h1 className="text-3xl mb-2">Terms and Conditions</h1>
            </div>

            <div className="sm:px-8 pb-8">
              <div className="mb-8 p-4">
                <p className="text-gray-800 leading-relaxed font-medium">
                  {t("Written notice for anything in this agreement means email or SMS/text message to TruShine's official contact information on your invoice/estimate/website (or the number/email used to confirm your appointment).")}
                </p>
              </div>

              {/* OLD TERMS - HIDDEN
              <div className="space-y-8">
                GENERAL TERMS
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    General Terms
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Any special accommodations must be reviewed and approved by TWC management before accepting the
                        proposal.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Quotations are valid for 30 days and must be accepted in writing (signature or electronic
                        acceptance).
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        All work will be completed in a professional, workmanlike manner, in compliance with local
                        codes/regulations.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        TWC is properly insured against injury to employees and losses from employee actions.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        TWC reserves the right to update these Terms and Conditions at any time.
                      </p>
                    </div>
                  </div>
                </section>

                WINDOW CLEANING
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    Window Cleaning
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        All windows must be securely closed on the day of service.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Client responsible for ensuring items are structurally sound. TWC may document/refuse
                        questionable items.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Full access required; obstacles will not be moved. $75 trip fee if no access available.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Unsafe/inaccessible windows will not be cleaned.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        External glass cleaned with water-fed pole using pure water, left to dry naturally.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        "Window" includes frame, sill, sash, and glass (wood, aluminum, steel, UPVC). Brick/tile/stone
                        sills excluded.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        <span className="font-semibold text-700">36-hour Streak-Free Guarantee</span> on all
                        window cleaning packages.
                      </p>
                    </div>
                  </div>
                </section>

                PRESSURE WASHING
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    Pressure Washing
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Pressure washing removes most stains; some marks may remain.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">External water access is required.</p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Client must cover/remove outdoor furniture. $150 fee if TWC must do it. Not liable for chemical
                        damage.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        <span className="font-semibold text-700">3-day satisfaction guarantee</span> on premium
                        pressure washing packages only.
                      </p>
                    </div>
                  </div>
                </section>

                GUTTER CLEANING
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    Gutter Cleaning
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Basic cleaning includes clearing internal gutters only. Hauling debris/repairs not included
                        unless agreed.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Cleaning done via leaf blower; downspouts flushed with hose.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Exterior gutter surface cleaning not included (available at additional cost).
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        <span className="font-semibold text-700">15-day guarantee</span> on all gutter cleaning
                        packages.
                      </p>
                    </div>
                  </div>
                </section>

                AWNING CLEANING
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    Awning Cleaning
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        TWC not liable for unexpected damage during awning cleaning.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Service may be declined if material is over 5 years old or fails inspection.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        <span className="font-semibold">24-hour guarantee</span> on all awning cleaning
                        services.
                      </p>
                    </div>
                  </div>
                </section>

                RESCHEDULING, CANCELLATION & CLIENT RESPONSIBILITIES
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    Rescheduling, Cancellation & Client Responsibilities
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Each client may reschedule up to 2 times, within 7 days of original date.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Rescheduling/cancellation within 8 hours:{" "}
                        <span className="font-semibold text-600">$35 fee</span>.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        More than 8 hours in advance: free (first 2 times).
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Beyond 2 reschedules may incur full service amount fee.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">{t(`TruShine not liable for delays due to weather/supply/uncontrollable issues.`)}</p>
                    </div>
                  </div>
                </section>

                PAYMENTS
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">Payments</h2>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Payment due upon completion unless otherwise agreed.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        TWC may require credit card info or $100 deposit. Jobs needing materials: 50% deposit.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Accepted: cash, check, credit card (in person, phone, or online).
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Commercial account payments can be mailed to:{" "}
                        <span className="font-semibold">3525 Murdock ST, Houston, TX 77047</span>.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Clients with unpaid balances may be denied further service.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Disputed payments are client's responsibility. Late/recovery fees may apply.
                      </p>
                    </div>
                  </div>
                </section>

                LATE FEES
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">Late Fees</h2>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Residential: <span className="font-semibold text-600">10% late fee after 1 day</span>.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Commercial: <span className="font-semibold text-600">10% late fee after 30 days</span>.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Balances unpaid after 60 days sent to collections (including legal fees).
                      </p>
                    </div>
                  </div>
                </section>

                OTHER POLICIES
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    Other Policies
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        All sales final. Refunds only for unused material during service.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        14-day written notice required for cancellation. Less notice = full charge.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        All services subject to applicable Texas state TAX.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        If a complaint revisit finds work satisfactory, $75 trip fee applies.
                      </p>
                    </div>
                  </div>
                </section>

                Recurring Service Agreement
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    Recurring Service Agreement
                  </h2>
                  <p className="text-gray-700 leading-relaxed text-base mb-6">{t(`This Recurring Service Agreement outlines the terms and conditions for ongoing window cleaning
                    and/or gutter cleaning services provided by TruShine Window Cleaning.`)}</p>

                  <div className="space-y-6">
                    <div className="p-6 rounded-lg">
                      <h3 className="text-lg text-900 mb-4">1. Scope of Services</h3>
                      <p className="text-gray-700 text-base mb-4">{t(`TruShine agrees to perform recurring services, which may include:`)}</p>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Window Cleaning:</h4>
                          <div className="ml-4 space-y-2">
                            <div className="flex items-start">
                              <span className="text-600 mr-2 mt-1">•</span>
                              <p className="text-gray-700 text-base">
                                Exterior window cleaning for all accessible glass
                              </p>
                            </div>
                            <div className="flex items-start">
                              <span className="text-600 mr-2 mt-1">•</span>
                              <p className="text-gray-700 text-base">Optional interior window cleaning if included</p>
                            </div>
                            <div className="flex items-start">
                              <span className="text-600 mr-2 mt-1">•</span>
                              <p className="text-gray-700 text-base">
                                Add-on services such as screen cleaning, track detailing, and hard water removal are
                                available for an additional fee
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Gutter Cleaning:</h4>
                          <div className="ml-4 space-y-2">
                            <div className="flex items-start">
                              <span className="text-600 mr-2 mt-1">•</span>
                              <p className="text-gray-700 text-base">Removal of leaves and debris from gutters</p>
                            </div>
                            <div className="flex items-start">
                              <span className="text-600 mr-2 mt-1">•</span>
                              <p className="text-gray-700 text-base">
                                Flushing of downspouts to ensure proper water flow
                              </p>
                            </div>
                            <div className="flex items-start">
                              <span className="text-600 mr-2 mt-1">•</span>
                              <p className="text-gray-700 text-base">
                                Light roof debris removal near gutter lines when safely accessible
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <span className="text-600 mr-3 mt-1">•</span>
                          <p className="text-gray-700 text-base">
                            Services will be performed on a recurring basis according to the selected frequency
                            (monthly, bi-monthly, quarterly, semi-annual, or annual) and will continue until canceled
                            per the terms below.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className=" p-6 rounded-lg">
                      <h3 className="text-lg text-900 mb-4">2. Pricing & Payment Terms</h3>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <span className="text-600 mr-3 mt-1">•</span>
                          <p className="text-gray-700 text-base">
                            Clients on recurring service receive <strong>discounted pricing</strong> compared to
                            one-time service rates
                          </p>
                        </div>
                        <div className="flex items-start">
                          <span className="text-600 mr-3 mt-1">•</span>
                          <p className="text-gray-700 text-base">
                            Pricing is based on property size, service scope, and access conditions
                          </p>
                        </div>
                        <div className="flex items-start">
                          <span className="text-600 mr-3 mt-1">•</span>
                          <p className="text-gray-700 text-base">
                            Payment is due upon completion of each service unless prepaid or otherwise agreed
                          </p>
                        </div>
                        <div className="flex items-start">
                          <span className="text-600 mr-3 mt-1">•</span>
                          <p className="text-gray-700 text-base">
                            A valid credit card must be kept on file for automated billing; receipts are sent via email
                            after each charge
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-lg">
                      <h3 className="text-lg text-900 mb-4">3. Term, Renewal & Cancellation</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Agreement Terms by Frequency:</h4>
                          <div className="ml-4 space-y-2">
                            <div className="flex items-start">
                              <span className="text-600 mr-2 mt-1">•</span>
                              <p className="text-gray-700 text-base">
                                <strong>Monthly, Bi-Monthly, Quarterly, and Semi-Annual Services:</strong> Require a{" "}
                                <strong>minimum commitment of one full year</strong>
                              </p>
                            </div>
                            <div className="flex items-start">
                              <span className="text-600 mr-2 mt-1">•</span>
                              <p className="text-gray-700 text-base">
                                <strong>Quarterly Services:</strong> Minimum of <strong>4 scheduled services</strong>
                              </p>
                            </div>
                            <div className="flex items-start">
                              <span className="text-600 mr-2 mt-1">•</span>
                              <p className="text-gray-700 text-base">
                                <strong>Semi-Annual Services:</strong> Minimum of <strong>2 scheduled services</strong>
                              </p>
                            </div>
                            <div className="flex items-start">
                              <span className="text-600 mr-2 mt-1">•</span>
                              <p className="text-gray-700 text-base">
                                <strong>Annual Services:</strong> Require a{" "}
                                <strong>minimum 2-year commitment with at least 2 scheduled services per year</strong>
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Termination Rights:</h4>
                          <div className="ml-4 space-y-2">
                            <div className="flex items-start">
                              <span className="text-600 mr-2 mt-1">•</span>
                              <p className="text-gray-700 text-base">
                                Either party may terminate this agreement{" "}
                                <strong>after the minimum service commitment is met</strong> by providing at least{" "}
                                <strong>14 days' written notice</strong>
                              </p>
                            </div>
                            <div className="flex items-start">
                              <span className="text-600 mr-2 mt-1">•</span>
                              <p className="text-gray-700 text-base">{t(`TruShine reserves the right to cancel or reschedule service due to weather, safety
                                concerns, or access limitations`)}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Early Cancellation Policy:</h4>
                          <div className="ml-4 space-y-2">
                            <div className="flex items-start">
                              <span className="text-600 mr-2 mt-1">•</span>
                              <p className="text-gray-700 text-base">
                                If the client cancels <strong>before fulfilling their minimum service term</strong>, a
                                cancellation fee will apply
                              </p>
                            </div>
                            <div className="flex items-start">
                              <span className="text-600 mr-2 mt-1">•</span>
                              <p className="text-gray-700 text-base">
                                This fee equals the{" "}
                                <strong>
                                  difference between the discounted recurring rate and the standard one-time service
                                  rate
                                </strong>{" "}
                                (plus tax) for all completed services
                              </p>
                            </div>
                            <div className="flex items-start">
                              <span className="text-600 mr-2 mt-1">•</span>
                              <p className="text-gray-700 text-base">
                                The cancellation fee will be <strong>charged to the card on file</strong> on the day of
                                cancellation
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Post-Term Continuation:</h4>
                          <div className="ml-4 space-y-2">
                            <div className="flex items-start">
                              <span className="text-600 mr-2 mt-1">•</span>
                              <p className="text-gray-700 text-base">
                                Once the initial contract term is met, services will continue at the same recurring rate
                                unless the client provides written notice to cancel
                              </p>
                            </div>
                            <div className="flex items-start">
                              <span className="text-600 mr-2 mt-1">•</span>
                              <p className="text-gray-700 text-base">
                                No price increases will apply without client approval or advance written notice
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-lg">
                      <h3 className="text-lg text-900 mb-4">4. Client Responsibilities</h3>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <span className="text-600 mr-3 mt-1">•</span>
                          <p className="text-gray-700 text-base">
                            Ensure all service areas are accessible on scheduled service dates (e.g., gates unlocked,
                            pets secured)
                          </p>
                        </div>
                        <div className="flex items-start">
                          <span className="text-600 mr-3 mt-1">•</span>
                          <p className="text-gray-700 text-base">{t(`Notify TruShine of any pre-existing issues, fragile items, or safety concerns prior to
                            service`)}</p>
                        </div>
                        <div className="flex items-start">
                          <span className="text-600 mr-3 mt-1">•</span>
                          <p className="text-gray-700 text-base">
                            Communicate promptly about scheduling changes or property access restrictions
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-lg">
                      <h3 className="text-lg text-900 mb-4">5. Service Adjustments</h3>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <span className="text-600 mr-3 mt-1">•</span>
                          <p className="text-gray-700 text-base">
                            Service pricing may be updated if property conditions change or if the service scope is
                            modified
                          </p>
                        </div>
                        <div className="flex items-start">
                          <span className="text-600 mr-3 mt-1">•</span>
                          <p className="text-gray-700 text-base">
                            Clients may request upgrades, frequency changes, or add-on services with written notice
                          </p>
                        </div>
                        <div className="flex items-start">
                          <span className="text-600 mr-3 mt-1">•</span>
                          <p className="text-gray-700 text-base">{t(`TruShine will always provide advance notice of any pricing updates`)}</p>
                        </div>
                      </div>
                    </div>

                    <div className=" p-6 rounded-lg">
                      <h3 className="text-lg text-900 mb-4">6. Insurance & Liability</h3>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <span className="text-600 mr-3 mt-1">•</span>
                          <p className="text-gray-700 text-base">{t(`TruShine is fully insured and exercises care during all services`)}</p>
                        </div>
                        <div className="flex items-start">
                          <span className="text-600 mr-3 mt-1">•</span>
                          <p className="text-gray-700 text-base">{t(`TruShine is not responsible for pre-existing damage such as aged gutters, broken seals, or
                            cracked panes`)}</p>
                        </div>
                        <div className="flex items-start">
                          <span className="text-600 mr-3 mt-1">•</span>
                          <p className="text-gray-700 text-base">
                            Any service concerns must be reported within <strong>48 hours</strong> of completion for
                            review and resolution
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
              */}

              {/* NEW TERMS AND CONDITIONS */}
              <div className="space-y-8">
                {!isReady ? (
                  <Box sx={{ py: 2 }}>
                    <Skeleton variant="text" width="55%" height={40} sx={{ mb: 2 }} />
                    <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="100%" height={20} />
                  </Box>
                ) : (
                <>
                {/* Title */}
                <section>
                  <h1 className="text-3xl text-gray-900 mb-2 font-bold">{profile.name}</h1>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    Master Terms & Conditions + Recurring Service Addendum
                  </h2>
                  <p className="text-gray-700 leading-relaxed text-base mb-4">
                    (Window Cleaning • Gutter Cleaning • Pressure Washing • Awning Cleaning)
                  </p>
                </section>

                {/* Definitions */}
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    1) Definitions
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        <strong>"{profile.name} / {profile.abbreviation}"</strong> = {profile.name}.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        <strong>"Client"</strong> = the person or entity booking services.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        <strong>"Services"</strong> = work listed in the estimate/proposal/work order/invoice.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        <strong>"Visit"</strong> = a scheduled service appointment date.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        <strong>"Site"</strong> = the property where Services are performed.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        <strong>"Recurring Plan"</strong> = ongoing services scheduled monthly, bi-monthly, quarterly, semi-annual, or annual.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Acceptance & Agreement */}
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    2) Acceptance & Agreement
                  </h2>
                  <div className="space-y-3">
                    <p className="text-gray-700 leading-relaxed text-base">
                      Quotes are valid for 30 days and must be accepted in writing (signature, electronic acceptance, or checkbox). By booking, approving, paying, or accepting electronically, Client agrees to these Master Terms & Conditions. If Client enrolls in a Recurring Plan, the Recurring Service Addendum also applies.
                    </p>
                  </div>
                </section>

                {/* Professional Standards */}
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    3) Professional Standards, Codes, and Insurance
                  </h2>
                  <div className="space-y-3">
                    <p className="text-gray-700 leading-relaxed text-base">{t(`All work is performed in a professional, workmanlike manner and in compliance with applicable local codes and regulations. TruShine is properly insured against injury to employees and losses resulting from employee actions.`)}</p>
                  </div>
                </section>

                {/* Scope of Work */}
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    4) Scope of Work & Exclusions
                  </h2>
                  <div className="space-y-3">
                    <p className="text-gray-700 leading-relaxed text-base mb-4">
                      The scope is limited to what is specifically included in the estimate/proposal/work order. Anything not listed is excluded unless agreed in writing.
                    </p>
                    
                    <div className="ml-4 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">A) Window Cleaning</h3>
                        <div className="space-y-2 ml-4">
                          <p className="text-gray-700 leading-relaxed text-base">All windows must be securely closed on the day of service.</p>
                          <p className="text-gray-700 leading-relaxed text-base">Unsafe/inaccessible windows will not be cleaned.</p>
                          <p className="text-gray-700 leading-relaxed text-base">Exterior glass may be cleaned using a water-fed pole with pure water and left to dry naturally.</p>
                          <p className="text-gray-700 leading-relaxed text-base">"Window" includes frame, sill, sash, and glass (wood, aluminum, steel, UPVC). Brick/tile/stone sills are excluded.</p>
                          <p className="text-gray-700 leading-relaxed text-base">Add-ons (extra fee unless included): screen cleaning, track detailing, hard water removal, etc.</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">B) Gutter Cleaning</h3>
                        <div className="space-y-2 ml-4">
                          <p className="text-gray-700 leading-relaxed text-base">Basic gutter cleaning includes clearing internal gutters only.</p>
                          <p className="text-gray-700 leading-relaxed text-base">Debris hauling and repairs are not included unless agreed in writing.</p>
                          <p className="text-gray-700 leading-relaxed text-base">Cleaning may be performed via leaf blower; downspouts may be flushed with hose.</p>
                          <p className="text-gray-700 leading-relaxed text-base">Exterior gutter surface cleaning is not included (available for additional cost).</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">C) Pressure Washing</h3>
                        <div className="space-y-2 ml-4">
                          <p className="text-gray-700 leading-relaxed text-base">Removes most stains; some marks may remain.</p>
                          <p className="text-gray-700 leading-relaxed text-base">External water access is required.</p>
                          <p className="text-gray-700 leading-relaxed text-base">{t(`Client must cover/remove outdoor furniture. If TruShine must do it, a $150 fee may apply. TruShine is not liable for chemical damage to items not properly protected/removed.`)}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">D) Awning Cleaning</h3>
                        <div className="space-y-2 ml-4">
                          <p className="text-gray-700 leading-relaxed text-base">{t('TruShine is not liable for unexpected damage during awning cleaning.')}</p>
                          <p className="text-gray-700 leading-relaxed text-base">Service may be declined if material is over 5 years old or fails inspection.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Access, Safety, and Property Condition */}
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    5) Access, Safety, and Property Condition
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Client must provide full access to work areas (gates unlocked, pets secured, clear access).
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">{t(`TruShine will not move obstacles/furniture for access (unless agreed).`)}</p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">{t(`If TruShine arrives and cannot perform due to lack of access or unsafe conditions, a $75 trip fee applies.`)}</p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">{t(`Client is responsible for ensuring items/structures are sound. TruShine may document or refuse questionable items.`)}</p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">{t(`Any special accommodations must be reviewed and approved by TruShine management before accepting the proposal.`)}</p>
                    </div>
                  </div>
                </section>

                {/* Scheduling, Rescheduling, and Delays */}
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    6) Scheduling, Rescheduling, and Delays
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">{t(`TruShine is not liable for delays due to weather, supply issues, or other uncontrollable factors.`)}</p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Each Client may reschedule up to two (2) times within 7 days of the original date.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Rescheduling/cancellation requested within 8 hours of a scheduled Visit: <strong>$35 fee</strong>.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Rescheduling more than 8 hours in advance: no fee for the first 2 reschedules.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">{t(`Beyond 2 reschedules, TruShine may charge up to the full service amount to protect crew scheduling and reserved time.`)}</p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        <strong>Important:</strong> These rescheduling rules apply to all Visits, including Recurring Plan Visits.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Pricing, Deposits, and Payments */}
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    7) Pricing, Deposits, and Payments
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Payment is due upon completion unless otherwise agreed in writing.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">{t(`TruShine may require credit card info on file and/or a $100 deposit.`)}</p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Jobs needing materials may require a 50% deposit.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Accepted: cash, check, credit card (in person, by phone, or online).
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Commercial payments may be mailed to: <strong>3525 Murdock St, Houston, TX 77047</strong>.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Clients with unpaid balances may be denied further service.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Disputed payments are Client's responsibility; late/recovery fees may apply.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        All services are subject to applicable Texas state tax.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Late Fees & Collections */}
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    8) Late Fees & Collections
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Residential: <strong>10% late fee after 1 day</strong>.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Commercial: <strong>10% late fee after 30 days</strong>.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Balances unpaid after 60 days may be sent to collections, including legal fees and collection costs as permitted by law.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Guarantees */}
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    9) Guarantees (Service-Specific)
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        <strong>Window Cleaning:</strong> 36-hour streak-free guarantee on all window cleaning packages.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        <strong>Gutter Cleaning:</strong> 15-day guarantee on all gutter cleaning packages.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        <strong>Awning Cleaning:</strong> 24-hour guarantee on all awning cleaning services.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        <strong>Pressure Washing:</strong> 3-day satisfaction guarantee on premium pressure washing packages only.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Complaints, Re-Visits, and Trip Fees */}
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    10) Complaints, Re-Visits, and Trip Fees
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        Any service concerns must be reported within 48 hours of completion for review and resolution.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">{t(`TruShine must be given a reasonable opportunity to inspect and/or correct any confirmed workmanship issues.`)}</p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-600 mr-3 mt-1">•</span>
                      <p className="text-gray-700 leading-relaxed text-base">
                        If a complaint revisit finds the work satisfactory, a <strong>$75 trip fee</strong> applies.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Refund Policy */}
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    11) Refund Policy
                  </h2>
                  <div className="space-y-3">
                    <p className="text-gray-700 leading-relaxed text-base">
                      All sales are final. Refunds are only for unused materials during service (if applicable).
                    </p>
                  </div>
                </section>

                {/* Cancellation Policy */}
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    12) Cancellation Policy (One-Time / Non-Recurring)
                  </h2>
                  <div className="space-y-3">
                    <p className="text-gray-700 leading-relaxed text-base">{t(`Client cancellation requests should be provided with as much notice as possible. For larger or reserved jobs, TruShine may require 14 days' written notice; shorter notice may result in a charge up to the full service amount, depending on crew scheduling and reserved time.`)}</p>
                  </div>
                </section>

                {/* Liability Limits */}
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    13) Liability Limits & Pre-Existing Damage
                  </h2>
                  <div className="space-y-3">
                    <p className="text-gray-700 leading-relaxed text-base">{t(`TruShine is not responsible for pre-existing damage or deterioration including (but not limited to): aged gutters, rotted wood, failing seals, cracked panes, loose screens, or previously weakened/fragile items. Client must notify TruShine of known issues or safety concerns prior to service.`)}</p>
                  </div>
                </section>

                {/* Updates to Terms */}
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    14) Updates to Terms
                  </h2>
                  <div className="space-y-3">
                    <p className="text-gray-700 leading-relaxed text-base">{t(`TruShine reserves the right to update these Terms & Conditions at any time. Updated terms apply prospectively.`)}</p>
                  </div>
                </section>

                {/* Order of Priority */}
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    15) Order of Priority (If Anything Conflicts)
                  </h2>
                  <div className="space-y-3">
                    <p className="text-gray-700 leading-relaxed text-base mb-2">
                      If there is a conflict between documents:
                    </p>
                    <div className="ml-4 space-y-2">
                      <p className="text-gray-700 leading-relaxed text-base">1. The signed/accepted proposal/work order/invoice for the Visit, then</p>
                      <p className="text-gray-700 leading-relaxed text-base">2. the Recurring Service Addendum (if enrolled), then</p>
                      <p className="text-gray-700 leading-relaxed text-base">3. these Master Terms & Conditions.</p>
                    </div>
                  </div>
                </section>

                {/* Recurring Service Addendum */}
                <section>
                  <h2 className="text-2xl text-gray-900 mb-4 pb-2 border-b-2 border-600">
                    Recurring Service Addendum
                  </h2>
                  <p className="text-gray-700 leading-relaxed text-base mb-4">
                    (Window Cleaning & Gutter Cleaning)
                  </p>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">R1) Scope of Recurring Services</h3>
                      <div className="space-y-3 ml-4">
                        <p className="text-gray-700 leading-relaxed text-base">{t(`TruShine will perform recurring window cleaning and/or gutter cleaning as selected:`)}</p>
                        <div className="ml-4 space-y-2">
                          <p className="text-gray-700 leading-relaxed text-base">
                            <strong>Window Cleaning:</strong> exterior window cleaning for all accessible glass; interior if included; add-ons available for additional fee.
                          </p>
                          <p className="text-gray-700 leading-relaxed text-base">
                            <strong>Gutter Cleaning:</strong> removal of debris; flushing downspouts; light roof debris removal near gutter lines when safely accessible.
                          </p>
                        </div>
                        <p className="text-gray-700 leading-relaxed text-base">
                          Services occur on the chosen frequency: monthly, bi-monthly, quarterly, semi-annual, or annual, and continue until canceled per this Addendum.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">R2) Pricing & Payment Terms (Recurring)</h3>
                      <div className="space-y-3 ml-4">
                        <div className="flex items-start">
                          <span className="text-600 mr-3 mt-1">•</span>
                          <p className="text-gray-700 leading-relaxed text-base">
                            Recurring clients receive discounted pricing compared to one-time rates.
                          </p>
                        </div>
                        <div className="flex items-start">
                          <span className="text-600 mr-3 mt-1">•</span>
                          <p className="text-gray-700 leading-relaxed text-base">
                            Pricing is based on property size, service scope, and access conditions.
                          </p>
                        </div>
                        <div className="flex items-start">
                          <span className="text-600 mr-3 mt-1">•</span>
                          <p className="text-gray-700 leading-relaxed text-base">
                            <strong>Billing timing:</strong>{' '}
                            {t('For Recurring Plan Visits, Client authorizes TruShine to charge the card on file after completion of each Visit (same day), unless otherwise agreed in writing.')}
                          </p>
                        </div>
                        <div className="flex items-start">
                          <span className="text-600 mr-3 mt-1">•</span>
                          <p className="text-gray-700 leading-relaxed text-base">
                            A valid credit card must be kept on file for automated billing; receipts are sent via email after each charge.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">R3) Minimum Commitment (By Frequency)</h3>
                      <div className="space-y-3 ml-4">
                        <p className="text-gray-700 leading-relaxed text-base">
                          Minimum commitment applies based on plan frequency:
                        </p>
                        <div className="ml-4 space-y-2">
                          <p className="text-gray-700 leading-relaxed text-base">
                            <strong>Monthly, Bi-Monthly, Quarterly, Semi-Annual:</strong> minimum one (1) year commitment.
                          </p>
                          <p className="text-gray-700 leading-relaxed text-base">
                            <strong>Quarterly:</strong> minimum 4 scheduled services
                          </p>
                          <p className="text-gray-700 leading-relaxed text-base">
                            <strong>Semi-Annual:</strong> minimum 2 scheduled services
                          </p>
                          <p className="text-gray-700 leading-relaxed text-base">
                            <strong>Annual:</strong> minimum two (2) year commitment with at least 2 scheduled services per year.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">R4) Renewal & Post-Term Continuation</h3>
                      <div className="space-y-3 ml-4">
                        <p className="text-gray-700 leading-relaxed text-base">
                          After the minimum commitment is met, the plan continues automatically at the same recurring rate unless Client cancels with written notice (as defined at the top). No price increases apply without Client approval or advance written notice.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">R5) Cancellation After Minimum Term</h3>
                      <div className="space-y-3 ml-4">
                        <p className="text-gray-700 leading-relaxed text-base">
                          After the minimum commitment is met, either party may terminate with at least 14 days' written notice.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">R6) Early Cancellation Policy (Before Minimum Term)</h3>
                      <div className="space-y-3 ml-4">
                        <p className="text-gray-700 leading-relaxed text-base">
                          If Client cancels before fulfilling the minimum service term, a cancellation fee applies equal to:
                        </p>
                        <div className="ml-4">
                          <p className="text-gray-700 leading-relaxed text-base">
                            the difference between the discounted recurring rate and the standard one-time rate (plus tax) for all completed Visits to date.
                          </p>
                        </div>
                        <p className="text-gray-700 leading-relaxed text-base">
                          This fee will be charged to the card on file on the day of cancellation.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">R7) Client Responsibilities (Recurring)</h3>
                      <div className="space-y-3 ml-4">
                        <div className="flex items-start">
                          <span className="text-600 mr-3 mt-1">•</span>
                          <p className="text-gray-700 leading-relaxed text-base">
                            Ensure access on scheduled dates (gates unlocked, pets secured, clear paths).
                          </p>
                        </div>
                        <div className="flex items-start">
                          <span className="text-600 mr-3 mt-1">•</span>
                          <p className="text-gray-700 leading-relaxed text-base">{t(`Notify TruShine of pre-existing issues, fragile items, or safety concerns.`)}</p>
                        </div>
                        <div className="flex items-start">
                          <span className="text-600 mr-3 mt-1">•</span>
                          <p className="text-gray-700 leading-relaxed text-base">
                            Communicate promptly about scheduling changes or access restrictions.
                          </p>
                        </div>
                        <div className="flex items-start">
                          <span className="text-600 mr-3 mt-1">•</span>
                          <p className="text-gray-700 leading-relaxed text-base">{t(`If TruShine arrives and cannot perform due to lack of access, the $75 trip fee applies, and rescheduling fees may also apply.`)}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">R8) Service Adjustments & Changes</h3>
                      <div className="space-y-3 ml-4">
                        <p className="text-gray-700 leading-relaxed text-base">{t(`Pricing may be updated if property conditions change or the service scope is modified. Client may request upgrades, add-ons, or frequency changes with written notice. TruShine will provide advance notice of pricing updates.`)}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">R9) Weather / Safety / Access Limitations</h3>
                      <div className="space-y-3 ml-4">
                        <p className="text-gray-700 leading-relaxed text-base">{t(`TruShine may cancel or reschedule due to weather, safety concerns, or access limitations.`)}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Checkbox Acceptance */}
                {/* <section className="mt-8 p-6 bg-gray-50 rounded-lg border-2 border-gray-300">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Checkbox Acceptance Line (Use on GHL Forms)</h3>
                  <p className="text-gray-700 leading-relaxed text-base">{t(`By checking this box, I agree to TruShine Window Cleaning's Master Terms & Conditions and, if enrolled, the Recurring Service Addendum. I authorize TruShine to keep a card on file and charge for recurring services after each completed Visit according to these terms.`)}</p>
                </section> */}
                </>
                )}
              </div>

              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-2">
                    {t('For questions about these terms, please contact TruShine Window Cleaning')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsAndConditions
