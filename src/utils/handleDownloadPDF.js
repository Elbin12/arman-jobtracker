export const handleDownloadPDF = async (
  setIsGeneratingPDF,
  quote,
  contact,
  address,
  quote_schedule,
  service_selections,
  custom_products,
  globalPriceData,
  additional_data,
  house_sqft
) => {
  setIsGeneratingPDF(true)
  try {
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF()

    const colors = {
      black: "#000000",
      gray: "#666666",
      lightGray: "#f5f5f5",
    }

    let yPosition = 20
    const pageHeight = doc.internal.pageSize.height
    const pageWidth = doc.internal.pageSize.width
    const margin = 20
    const lineHeight = 6
    const maxLineWidth = pageWidth - margin * 2

    const checkPageBreak = (linesNeeded = 1) => {
      if (yPosition + linesNeeded * lineHeight > pageHeight - 30) {
        doc.addPage()
        yPosition = 20
      }
    }

    const formatPrice = (price) => {
      const num = Number(price)
      return isNaN(num) ? "$0.00" : `$${num.toFixed(2)}`
    }

    const addWrappedText = (text, x, y) => {
      const split = doc.splitTextToSize(String(text || ""), maxLineWidth)
      doc.text(split, x, y)
      return split.length * lineHeight
    }

    const formatResponse = (response) => {
      const { question_type, yes_no_answer, text_answer, sub_question_responses, option_responses } = response
      switch (question_type) {
        case "yes_no":
        case "conditional":
          return [yes_no_answer ? "Yes" : "No"]
        case "options":
        case "describe":
          if (option_responses?.length > 0) return option_responses.map(opt => opt.option_text)
          return [text_answer || "N/A"]
        case "quantity":
          if (option_responses?.length > 0) {
            return option_responses.map(opt => `${opt.option_text} — Qty: ${opt.quantity}`)
          }
          return ["N/A"]
        case "multiple_yes_no":
          if (sub_question_responses?.length > 0) {
            return sub_question_responses.map(sub => `${sub.sub_question_text}: ${sub.yes_no_answer}`)
          }
          return ["N/A"]
        default:
          return [text_answer || "N/A"]
      }
    }

    const getBase64FromUrl = async (url) => {
      const response = await fetch(url)
      const blob = await response.blob()
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    }

    const toTitleCase = (str) => {
      if (!str) return ""
      return str.toLowerCase().split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    }

    // ------------------------
    // Logo + Header
    // ------------------------
    const logoBase64 = await getBase64FromUrl(import.meta.env.VITE_COMPANY_LOGO_URL || 'https://storage.googleapis.com/msgsndr/b8qvo7VooP3JD3dIZU42/media/683efc8fd5817643ff8194f0.jpeg')
    const logoSize = 30
    doc.addImage(logoBase64, "JPEG", margin, yPosition, logoSize, logoSize)
    const textOffsetY = yPosition + logoSize / 2 - 5

    doc.setFontSize(18)
    doc.setFont(undefined, "bold")
    doc.text(import.meta.env.VITE_COMPANY_NAME || 'TruShine Window Cleaning', margin + logoSize + 10, textOffsetY)

    doc.setFontSize(10)
    doc.setFont(undefined, "normal")
    doc.text(import.meta.env.VITE_COMPANY_TAGLINE || 'Professional Cleaning Services', margin + logoSize + 10, textOffsetY + 8)

    yPosition += logoSize + 15

    doc.setDrawColor(colors.black)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 15

    doc.setFontSize(16)
    doc.setFont(undefined, "bold")
    doc.text("SERVICE QUOTE", margin, yPosition)

    doc.setFontSize(10)
    doc.setFont(undefined, "normal")
    doc.text(`Quote #: ${quote.id}`, pageWidth - margin - 60, yPosition - 5)
    doc.text(`Date: ${new Date(quote.created_at).toLocaleDateString()}`, pageWidth - margin - 60, yPosition + 3)
    yPosition += 20

    // ------------------------
    // Customer Info
    // ------------------------
    doc.setFontSize(12)
    doc.setFont(undefined, "bold")
    doc.text("CUSTOMER INFORMATION", margin, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    doc.setFont(undefined, "normal")
    doc.text(`Name: ${toTitleCase(contact?.first_name) || ""} ${toTitleCase(contact?.last_name) || ""}`, margin, yPosition)
    yPosition += 6
    doc.text(`Email: ${contact?.email || "N/A"}`, margin, yPosition)
    yPosition += 6
    doc.text(`Phone: ${contact?.phone || "N/A"}`, margin, yPosition)
    yPosition += 6
    doc.text(`Property Size: ${house_sqft || "N/A"} sq ft`, margin, yPosition)
    yPosition += 6

    if (address) {
      const fullAddress = `${address.name || ""}, ${address.street_address || ""}, ${address.city || ""}, ${address.state || ""} ${address.postal_code || ""}`
      yPosition += addWrappedText(`Address: ${fullAddress}`, margin, yPosition) + 3
    }

    yPosition += 10

    // ------------------------
    // Scheduled Service
    // ------------------------
    if (quote_schedule?.is_submitted && quote_schedule?.scheduled_date) {
      doc.setFontSize(12)
      doc.setFont(undefined, "bold")
      doc.text("SCHEDULED SERVICE", margin, yPosition)
      yPosition += 10

      const scheduledDate = new Date(quote_schedule.scheduled_date)
      doc.setFontSize(10)
      doc.setFont(undefined, "normal")
      doc.text(
        `Date: ${scheduledDate.toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        margin,
        yPosition
      )
      yPosition += 6
      doc.text(
        `Time: ${scheduledDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`,
        margin,
        yPosition
      )
      yPosition += 15
    }

    // ------------------------
    // Service Selections
    // ------------------------
    if (service_selections?.length > 0) {
      doc.setFontSize(12)
      doc.setFont(undefined, "bold")
      doc.text("SERVICES", margin, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont(undefined, "bold")
      doc.text("Description", margin, yPosition)
      doc.text("Price", pageWidth - margin - 40, yPosition)
      yPosition += 8
      doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2)
      yPosition += 5
      doc.setFont(undefined, "normal")

      service_selections.forEach((selection, index) => {
        checkPageBreak(2)
        doc.text(selection.service_details?.name || "Service", margin, yPosition)
        doc.text(formatPrice(selection.final_total_price), pageWidth - margin - 40, yPosition)
        yPosition += 6

        if (selection.service_details?.description) {
          yPosition += addWrappedText(`Description: ${selection.service_details.description}`, margin + 5, yPosition)
        }

        if (selection.selected_package_details) {
          doc.text(`Package: ${selection.selected_package_details.name}`, margin + 5, yPosition)
          yPosition += 6
        }

        if (selection.question_responses?.length > 0) {
          doc.text("Responses:", margin + 5, yPosition)
          yPosition += 6
          selection.question_responses.forEach((response) => {
            checkPageBreak(2)
            const answers = formatResponse(response)
            doc.text(`• ${response.question_text}:`, margin + 10, yPosition)
            yPosition += 6
            answers.forEach(ans => {
              yPosition += addWrappedText(`   - ${ans}`, margin + 15, yPosition)
            })
            yPosition += 3
          })
        }

        yPosition += 5
      })
    }

    // ------------------------
    // Custom Services
    // ------------------------
    if (custom_products?.length > 0) {
      doc.setFontSize(12)
      doc.setFont(undefined, "bold")
      doc.text("ADDITIONAL SERVICES", margin, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont(undefined, "bold")
      doc.text("Description", margin, yPosition)
      doc.text("Price", pageWidth - margin - 40, yPosition)
      yPosition += 8
      doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2)
      yPosition += 5
      doc.setFont(undefined, "normal")

      custom_products.forEach((product) => {
        checkPageBreak(2)
        doc.text(product.product_name, margin, yPosition)
        doc.text(formatPrice(product.price), pageWidth - margin - 40, yPosition)
        yPosition += 6
        if (product.description) {
          yPosition += addWrappedText(product.description, margin + 5, yPosition)
        }
      })
      yPosition += 10
    }

    // ------------------------
    // Pricing Summary
    // ------------------------
    doc.setFontSize(12)
    doc.setFont(undefined, "bold")
    doc.text("PRICING SUMMARY", margin, yPosition)
    yPosition += 10

    // Calculate all values like the web page does
    const totalServicePrice = service_selections?.reduce((sum, s) => sum + Number(s.final_total_price || 0), 0) || 0
    const customServiceTotal = custom_products?.reduce((sum, p) => sum + Number(p.price || 0), 0) || 0
    let subtotal = 0;
    if (service_selections?.length > 0) {
      if (totalServicePrice < (globalPriceData?.base_price || 0)) {
        subtotal = Number(globalPriceData?.base_price || 0)
      } else {
        subtotal = totalServicePrice + customServiceTotal
      }
    } else {
      subtotal = Number(quote?.final_total || 0)
    }
    // const adjustment = subtotal < (globalPriceData?.base_price || 0) ? (globalPriceData?.base_price || 0) - subtotal : 0
    const final = subtotal
    const taxRate = parseFloat(import.meta.env.VITE_TAX_RATE) || 0.0825
    const taxAmount = final * taxRate
    const finalWithTax = final + taxAmount

    console.log('subtotal', subtotal)
    console.log('final', final, typeof(final))
    console.log('taxAmount', taxAmount, typeof(taxAmount))
    console.log('finalWithTax', finalWithTax) 
    console.log('customServiceTotal', customServiceTotal)
    console.log('totalServicePrice', totalServicePrice)

    doc.setFontSize(10)
    doc.setFont(undefined, "normal")

    // Individual service prices
    if (service_selections?.length > 0) {
      service_selections.forEach((service) => {
        checkPageBreak(1)
        doc.text(service.service_details?.name || "Service", margin, yPosition)
        doc.text(formatPrice(service.final_total_price), pageWidth - margin - 40, yPosition)
        yPosition += 6
      })
    }

    // Custom Services (if any)
    if (custom_products?.length > 0 && Number.parseFloat(customServiceTotal) > 0) {
      checkPageBreak(1)
      doc.text("Custom Services", margin, yPosition)
      doc.text(formatPrice(customServiceTotal), pageWidth - margin - 40, yPosition)
      yPosition += 6
    }

    // Adjustments
    // checkPageBreak(1)
    // doc.text("Adjustments", margin, yPosition)
    // doc.text(formatPrice(adjustment), pageWidth - margin - 40, yPosition)
    // yPosition += 6

    // Tax
    checkPageBreak(1)
    const taxRatePercent = ((parseFloat(import.meta.env.VITE_TAX_RATE) || 0.0825) * 100).toFixed(2)
    doc.text(`Tax (${taxRatePercent}%)`, margin, yPosition)
    doc.text(formatPrice(taxAmount), pageWidth - margin - 40, yPosition)
    yPosition += 6

    // Add note if minimum base price applies
    if (subtotal < (globalPriceData?.base_price || 0)) {
      checkPageBreak(2)
      yPosition += 3
      doc.setFontSize(9)
      doc.setTextColor("#dc2626") // Red color for the note
      doc.text(`Note: Minimum base price is ${formatPrice(globalPriceData?.base_price || 0)}`, margin, yPosition)
      yPosition += 6
      doc.setFontSize(10)
      doc.setTextColor("#000000") // Reset to black
    }

    // Separator line
    yPosition += 3
    doc.setDrawColor("#000000")
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    // Final Total
    doc.setFont(undefined, "bold")
    doc.text("Final Total", margin, yPosition)
    doc.text(formatPrice(finalWithTax), pageWidth - margin - 40, yPosition)

    // Tax included note
    yPosition += 6
    doc.setFontSize(9)
    doc.setFont(undefined, "normal")
    doc.setTextColor("#666666")
    doc.text("Tax included", pageWidth - margin - 40, yPosition)

    // Reset formatting
    doc.setFontSize(10)
    doc.setTextColor("#000000")
    yPosition += 15

    // ------------------------
    // Additional Notes
    // ------------------------
    if (additional_data?.additional_notes) {
      doc.setFontSize(12)
      doc.setFont(undefined, "bold")
      doc.text("NOTES", margin, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont(undefined, "normal")
      yPosition += addWrappedText(additional_data.additional_notes, margin, yPosition) + 3
    }

    // ------------------------
    // Signature
    // ------------------------
    // if (additional_data?.signature) {
    //   checkPageBreak(10)
    //   doc.setFontSize(12)
    //   doc.setFont(undefined, "bold")
    //   doc.setTextColor("#000000")
    //   doc.text("CUSTOMER SIGNATURE", margin, yPosition)
    //   yPosition += 8

    //   try {
    //     // Professional signature size
    //     doc.addImage(`data:image/png;base64,${additional_data.signature}`, "PNG", margin, yPosition, 100, 40)
    //     yPosition += 45
    //   } catch (e) {
    //     doc.setFontSize(10)
    //     doc.setFont(undefined, "normal")
    //     doc.setTextColor("#666666")
    //     doc.text("Digital signature on file", margin, yPosition)
    //     yPosition += 10
    //   }
      
    //   // Use actual signature timestamp from submitted_at, otherwise use current date
    //   const signatureDate = additional_data?.submitted_at 
    //     ? new Date(additional_data.submitted_at)
    //     : new Date();
      
    //   yPosition += 3
    //   doc.setFontSize(10)
    //   doc.setFont(undefined, "normal")
    //   doc.setTextColor("#000000")
    //   doc.text(`Date: ${signatureDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, yPosition)
    //   yPosition += 5
    //   doc.text(`Time: ${signatureDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`, margin, yPosition)
    //   yPosition += 15
    // }

    // ------------------------
    // Terms & Conditions Agreement
    // ------------------------
    // if (quote?.status === "accepted") {
    //   checkPageBreak(4)
    //   doc.setFontSize(10)
    //   doc.setFont(undefined, "normal")
    //   doc.setTextColor("#374151")
    //   yPosition += 5
    //   doc.text("✓ I have read and agree to the Terms & Conditions and Privacy Policy", margin, yPosition)
    //   yPosition += 10
    // }

    // ------------------------
    // Terms and Conditions Document
    // ------------------------
    if (quote?.status === "accepted" || "submitted") {
      // Get signature timestamp for agreement date from submitted_at
      const agreementDate = additional_data?.submitted_at 
        ? new Date(additional_data.submitted_at)
        : new Date();
      
      // Start new page for Terms & Conditions
      doc.addPage()
      yPosition = 20
      
      // Header
      doc.setFontSize(16)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("TERMS AND CONDITIONS", margin, yPosition)
      yPosition += 5
      
      // Company Name
      doc.setFontSize(10)
      doc.setFont(undefined, "normal")
      doc.text(import.meta.env.VITE_COMPANY_NAME || 'TruShine Window Cleaning', margin, yPosition)
      yPosition += 8
      
      // Agreement Statement with Timestamp
      doc.setFontSize(10)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#1f2937")
      const agreementText = `CLIENT AGREEMENT ACKNOWLEDGMENT`
      doc.text(agreementText, margin, yPosition)
      yPosition += 6
      
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const acknowledgmentText = `The client has read and agreed to the Terms & Conditions and Privacy Policy`
      const acknowledgmentLines = doc.splitTextToSize(acknowledgmentText, maxLineWidth)
      doc.text(acknowledgmentLines, margin, yPosition)
      yPosition += 6
      
      doc.setFont(undefined, "bold")
      doc.setTextColor("#1f2937")
      doc.text(`Agreement Date & Time: ${agreementDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${agreementDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`, margin, yPosition)
      yPosition += 10
      
      // Divider line
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10
      
      // OLD TERMS - HIDDEN
      // Terms Content
      // doc.setFontSize(11)
      // doc.setFont(undefined, "bold")
      // doc.setTextColor("#000000")
      // doc.text("GENERAL TERMS", margin, yPosition)
      // ... (old terms code hidden)
      
      // NEW TERMS AND CONDITIONS
      // Written Notice Definition
      doc.setFontSize(9)
      doc.setFont(undefined, "italic")
      doc.setTextColor("#374151")
      const noticeText = "Written notice for anything in this agreement means email or SMS/text message to TruShine's official contact information on your invoice/estimate/website (or the number/email used to confirm your appointment)."
      const noticeLines = doc.splitTextToSize(noticeText, maxLineWidth)
      doc.text(noticeLines, margin, yPosition)
      yPosition += noticeLines.length * lineHeight + 5
      
      // 1) Definitions
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("1) Definitions", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const definitions = [
        "\"TruShine / TWC\" = TruShine Window Cleaning.",
        "\"Client\" = the person or entity booking services.",
        "\"Services\" = work listed in the estimate/proposal/work order/invoice.",
        "\"Visit\" = a scheduled service appointment date.",
        "\"Site\" = the property where Services are performed.",
        "\"Recurring Plan\" = ongoing services scheduled monthly, bi-monthly, quarterly, semi-annual, or annual."
      ]
      definitions.forEach(term => {
        checkPageBreak(3)
        const lines = doc.splitTextToSize(term, maxLineWidth - 5)
        doc.text(lines, margin + 5, yPosition)
        yPosition += lines.length * lineHeight + 2
      })
      
      // 2) Acceptance & Agreement
      yPosition += 3
      checkPageBreak(4)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("2) Acceptance & Agreement", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const acceptanceText = "Quotes are valid for 30 days and must be accepted in writing (signature, electronic acceptance, or checkbox). By booking, approving, paying, or accepting electronically, Client agrees to these Master Terms & Conditions. If Client enrolls in a Recurring Plan, the Recurring Service Addendum also applies."
      const acceptanceLines = doc.splitTextToSize(acceptanceText, maxLineWidth - 5)
      doc.text(acceptanceLines, margin + 5, yPosition)
      yPosition += acceptanceLines.length * lineHeight + 3
      
      // 3) Professional Standards
      checkPageBreak(4)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("3) Professional Standards, Codes, and Insurance", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const standardsText = "All work is performed in a professional, workmanlike manner and in compliance with applicable local codes and regulations. TruShine is properly insured against injury to employees and losses resulting from employee actions."
      const standardsLines = doc.splitTextToSize(standardsText, maxLineWidth - 5)
      doc.text(standardsLines, margin + 5, yPosition)
      yPosition += standardsLines.length * lineHeight + 3
      
      // 4) Scope of Work & Exclusions
      checkPageBreak(6)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("4) Scope of Work & Exclusions", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const scopeIntro = "The scope is limited to what is specifically included in the estimate/proposal/work order. Anything not listed is excluded unless agreed in writing."
      const scopeIntroLines = doc.splitTextToSize(scopeIntro, maxLineWidth - 5)
      doc.text(scopeIntroLines, margin + 5, yPosition)
      yPosition += scopeIntroLines.length * lineHeight + 3
      
      const scopeTerms = [
        "A) Window Cleaning: All windows must be securely closed on the day of service. Unsafe/inaccessible windows will not be cleaned. Exterior glass may be cleaned using a water-fed pole with pure water and left to dry naturally. \"Window\" includes frame, sill, sash, and glass (wood, aluminum, steel, UPVC). Brick/tile/stone sills are excluded. Add-ons (extra fee unless included): screen cleaning, track detailing, hard water removal, etc.",
        "B) Gutter Cleaning: Basic gutter cleaning includes clearing internal gutters only. Debris hauling and repairs are not included unless agreed in writing. Cleaning may be performed via leaf blower; downspouts may be flushed with hose. Exterior gutter surface cleaning is not included (available for additional cost).",
        "C) Pressure Washing: Removes most stains; some marks may remain. External water access is required. Client must cover/remove outdoor furniture. If TruShine must do it, a $150 fee may apply. TruShine is not liable for chemical damage to items not properly protected/removed.",
        "D) Awning Cleaning: TruShine is not liable for unexpected damage during awning cleaning. Service may be declined if material is over 5 years old or fails inspection."
      ]
      scopeTerms.forEach(term => {
        checkPageBreak(4)
        const lines = doc.splitTextToSize(term, maxLineWidth - 5)
        doc.text(lines, margin + 5, yPosition)
        yPosition += lines.length * lineHeight + 2
      })
      
      // 5) Access, Safety, and Property Condition
      yPosition += 3
      checkPageBreak(6)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("5) Access, Safety, and Property Condition", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const accessTerms = [
        "• Client must provide full access to work areas (gates unlocked, pets secured, clear access).",
        "• TruShine will not move obstacles/furniture for access (unless agreed).",
        "• If TruShine arrives and cannot perform due to lack of access or unsafe conditions, a $75 trip fee applies.",
        "• Client is responsible for ensuring items/structures are sound. TruShine may document or refuse questionable items.",
        "• Any special accommodations must be reviewed and approved by TruShine management before accepting the proposal."
      ]
      accessTerms.forEach(term => {
        checkPageBreak(3)
        const lines = doc.splitTextToSize(term, maxLineWidth - 5)
        doc.text(lines, margin + 5, yPosition)
        yPosition += lines.length * lineHeight + 2
      })
      
      // 6) Scheduling, Rescheduling, and Delays
      yPosition += 3
      checkPageBreak(6)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("6) Scheduling, Rescheduling, and Delays", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const schedulingTerms = [
        "• TruShine is not liable for delays due to weather, supply issues, or other uncontrollable factors.",
        "• Each Client may reschedule up to two (2) times within 7 days of the original date.",
        "• Rescheduling/cancellation requested within 8 hours of a scheduled Visit: $35 fee.",
        "• Rescheduling more than 8 hours in advance: no fee for the first 2 reschedules.",
        "• Beyond 2 reschedules, TruShine may charge up to the full service amount to protect crew scheduling and reserved time.",
        "• Important: These rescheduling rules apply to all Visits, including Recurring Plan Visits."
      ]
      schedulingTerms.forEach(term => {
        checkPageBreak(3)
        const lines = doc.splitTextToSize(term, maxLineWidth - 5)
        doc.text(lines, margin + 5, yPosition)
        yPosition += lines.length * lineHeight + 2
      })
      
      // 7) Pricing, Deposits, and Payments
      yPosition += 3
      checkPageBreak(6)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("7) Pricing, Deposits, and Payments", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const paymentTerms = [
        "• Payment is due upon completion unless otherwise agreed in writing.",
        "• TruShine may require credit card info on file and/or a $100 deposit.",
        "• Jobs needing materials may require a 50% deposit.",
        "• Accepted: cash, check, credit card (in person, by phone, or online).",
        "• Commercial payments may be mailed to: 3525 Murdock St, Houston, TX 77047.",
        "• Clients with unpaid balances may be denied further service.",
        "• Disputed payments are Client's responsibility; late/recovery fees may apply.",
        "• All services are subject to applicable Texas state tax."
      ]
      paymentTerms.forEach(term => {
        checkPageBreak(3)
        const lines = doc.splitTextToSize(term, maxLineWidth - 5)
        doc.text(lines, margin + 5, yPosition)
        yPosition += lines.length * lineHeight + 2
      })
      
      // 8) Late Fees & Collections
      yPosition += 3
      checkPageBreak(6)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("8) Late Fees & Collections", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const lateFeeTerms = [
        "• Residential: 10% late fee after 1 day.",
        "• Commercial: 10% late fee after 30 days.",
        "• Balances unpaid after 60 days may be sent to collections, including legal fees and collection costs as permitted by law."
      ]
      lateFeeTerms.forEach(term => {
        checkPageBreak(3)
        const lines = doc.splitTextToSize(term, maxLineWidth - 5)
        doc.text(lines, margin + 5, yPosition)
        yPosition += lines.length * lineHeight + 2
      })
      
      // 9) Guarantees
      yPosition += 3
      checkPageBreak(6)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("9) Guarantees (Service-Specific)", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const guaranteeTerms = [
        "• Window Cleaning: 36-hour streak-free guarantee on all window cleaning packages.",
        "• Gutter Cleaning: 15-day guarantee on all gutter cleaning packages.",
        "• Awning Cleaning: 24-hour guarantee on all awning cleaning services.",
        "• Pressure Washing: 3-day satisfaction guarantee on premium pressure washing packages only."
      ]
      guaranteeTerms.forEach(term => {
        checkPageBreak(3)
        const lines = doc.splitTextToSize(term, maxLineWidth - 5)
        doc.text(lines, margin + 5, yPosition)
        yPosition += lines.length * lineHeight + 2
      })
      
      // 10) Complaints, Re-Visits, and Trip Fees
      yPosition += 3
      checkPageBreak(6)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("10) Complaints, Re-Visits, and Trip Fees", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const complaintTerms = [
        "• Any service concerns must be reported within 48 hours of completion for review and resolution.",
        "• TruShine must be given a reasonable opportunity to inspect and/or correct any confirmed workmanship issues.",
        "• If a complaint revisit finds the work satisfactory, a $75 trip fee applies."
      ]
      complaintTerms.forEach(term => {
        checkPageBreak(3)
        const lines = doc.splitTextToSize(term, maxLineWidth - 5)
        doc.text(lines, margin + 5, yPosition)
        yPosition += lines.length * lineHeight + 2
      })
      
      // 11) Refund Policy
      yPosition += 3
      checkPageBreak(4)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("11) Refund Policy", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const refundText = "All sales are final. Refunds are only for unused materials during service (if applicable)."
      const refundLines = doc.splitTextToSize(refundText, maxLineWidth - 5)
      doc.text(refundLines, margin + 5, yPosition)
      yPosition += refundLines.length * lineHeight + 3
      
      // 12) Cancellation Policy
      checkPageBreak(4)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("12) Cancellation Policy (One-Time / Non-Recurring)", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const cancellationText = "Client cancellation requests should be provided with as much notice as possible. For larger or reserved jobs, TruShine may require 14 days' written notice; shorter notice may result in a charge up to the full service amount, depending on crew scheduling and reserved time."
      const cancellationLines = doc.splitTextToSize(cancellationText, maxLineWidth - 5)
      doc.text(cancellationLines, margin + 5, yPosition)
      yPosition += cancellationLines.length * lineHeight + 3
      
      // 13) Liability Limits
      checkPageBreak(4)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("13) Liability Limits & Pre-Existing Damage", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const liabilityText = "TruShine is not responsible for pre-existing damage or deterioration including (but not limited to): aged gutters, rotted wood, failing seals, cracked panes, loose screens, or previously weakened/fragile items. Client must notify TruShine of known issues or safety concerns prior to service."
      const liabilityLines = doc.splitTextToSize(liabilityText, maxLineWidth - 5)
      doc.text(liabilityLines, margin + 5, yPosition)
      yPosition += liabilityLines.length * lineHeight + 3
      
      // 14) Updates to Terms
      checkPageBreak(4)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("14) Updates to Terms", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const updatesText = "TruShine reserves the right to update these Terms & Conditions at any time. Updated terms apply prospectively."
      const updatesLines = doc.splitTextToSize(updatesText, maxLineWidth - 5)
      doc.text(updatesLines, margin + 5, yPosition)
      yPosition += updatesLines.length * lineHeight + 3
      
      // 15) Order of Priority
      checkPageBreak(6)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("15) Order of Priority (If Anything Conflicts)", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const priorityIntro = "If there is a conflict between documents:"
      doc.text(priorityIntro, margin + 5, yPosition)
      yPosition += 6
      const priorityTerms = [
        "1. The signed/accepted proposal/work order/invoice for the Visit, then",
        "2. the Recurring Service Addendum (if enrolled), then",
        "3. these Master Terms & Conditions."
      ]
      priorityTerms.forEach(term => {
        checkPageBreak(3)
        const lines = doc.splitTextToSize(term, maxLineWidth - 5)
        doc.text(lines, margin + 5, yPosition)
        yPosition += lines.length * lineHeight + 2
      })
      
      // Recurring Service Addendum
      yPosition += 5
      checkPageBreak(8)
      doc.setFontSize(12)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("Recurring Service Addendum", margin, yPosition)
      yPosition += 8
      doc.setFontSize(10)
      doc.setFont(undefined, "normal")
      doc.text("(Window Cleaning & Gutter Cleaning)", margin, yPosition)
      yPosition += 8
      
      // R1) Scope of Recurring Services
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("R1) Scope of Recurring Services", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const recurringScopeText = "TruShine will perform recurring window cleaning and/or gutter cleaning as selected: Window Cleaning: exterior window cleaning for all accessible glass; interior if included; add-ons available for additional fee. Gutter Cleaning: removal of debris; flushing downspouts; light roof debris removal near gutter lines when safely accessible. Services occur on the chosen frequency: monthly, bi-monthly, quarterly, semi-annual, or annual, and continue until canceled per this Addendum."
      const recurringScopeLines = doc.splitTextToSize(recurringScopeText, maxLineWidth - 5)
      doc.text(recurringScopeLines, margin + 5, yPosition)
      yPosition += recurringScopeLines.length * lineHeight + 3
      
      // R2) Pricing & Payment Terms
      checkPageBreak(6)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("R2) Pricing & Payment Terms (Recurring)", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const recurringPaymentTerms = [
        "• Recurring clients receive discounted pricing compared to one-time rates.",
        "• Pricing is based on property size, service scope, and access conditions.",
        "• Billing timing: For Recurring Plan Visits, Client authorizes TruShine to charge the card on file after completion of each Visit (same day), unless otherwise agreed in writing.",
        "• A valid credit card must be kept on file for automated billing; receipts are sent via email after each charge."
      ]
      recurringPaymentTerms.forEach(term => {
        checkPageBreak(3)
        const lines = doc.splitTextToSize(term, maxLineWidth - 5)
        doc.text(lines, margin + 5, yPosition)
        yPosition += lines.length * lineHeight + 2
      })
      
      // R3) Minimum Commitment
      yPosition += 3
      checkPageBreak(6)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("R3) Minimum Commitment (By Frequency)", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const commitmentTerms = [
        "• Monthly, Bi-Monthly, Quarterly, Semi-Annual: minimum one (1) year commitment.",
        "• Quarterly: minimum 4 scheduled services",
        "• Semi-Annual: minimum 2 scheduled services",
        "• Annual: minimum two (2) year commitment with at least 2 scheduled services per year."
      ]
      commitmentTerms.forEach(term => {
        checkPageBreak(3)
        const lines = doc.splitTextToSize(term, maxLineWidth - 5)
        doc.text(lines, margin + 5, yPosition)
        yPosition += lines.length * lineHeight + 2
      })
      
      // R4-R9) Additional Recurring Terms
      const recurringSections = [
        { title: "R4) Renewal & Post-Term Continuation", text: "After the minimum commitment is met, the plan continues automatically at the same recurring rate unless Client cancels with written notice (as defined at the top). No price increases apply without Client approval or advance written notice." },
        { title: "R5) Cancellation After Minimum Term", text: "After the minimum commitment is met, either party may terminate with at least 14 days' written notice." },
        { title: "R6) Early Cancellation Policy (Before Minimum Term)", text: "If Client cancels before fulfilling the minimum service term, a cancellation fee applies equal to: the difference between the discounted recurring rate and the standard one-time rate (plus tax) for all completed Visits to date. This fee will be charged to the card on file on the day of cancellation." },
        { title: "R7) Client Responsibilities (Recurring)", text: "Ensure access on scheduled dates (gates unlocked, pets secured, clear paths). Notify TruShine of pre-existing issues, fragile items, or safety concerns. Communicate promptly about scheduling changes or access restrictions. If TruShine arrives and cannot perform due to lack of access, the $75 trip fee applies, and rescheduling fees may also apply." },
        { title: "R8) Service Adjustments & Changes", text: "Pricing may be updated if property conditions change or the service scope is modified. Client may request upgrades, add-ons, or frequency changes with written notice. TruShine will provide advance notice of pricing updates." },
        { title: "R9) Weather / Safety / Access Limitations", text: "TruShine may cancel or reschedule due to weather, safety concerns, or access limitations." }
      ]
      
      recurringSections.forEach(section => {
        yPosition += 3
        checkPageBreak(6)
        doc.setFontSize(11)
        doc.setFont(undefined, "bold")
        doc.setTextColor("#000000")
        doc.text(section.title, margin, yPosition)
        yPosition += 7
        
        doc.setFontSize(9)
        doc.setFont(undefined, "normal")
        doc.setTextColor("#374151")
        const sectionLines = doc.splitTextToSize(section.text, maxLineWidth - 5)
        doc.text(sectionLines, margin + 5, yPosition)
        yPosition += sectionLines.length * lineHeight + 2
      })
      
      // Final Agreement Statement
      yPosition += 10
      checkPageBreak(6)
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10
      
      doc.setFontSize(10)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const finalAgreement = "By signing this document, the client acknowledges that they have read, understood, and agreed to all Terms & Conditions contained in this proposal."
      const finalAgreementLines = doc.splitTextToSize(finalAgreement, maxLineWidth)
      doc.text(finalAgreementLines, margin, yPosition)
      yPosition += finalAgreementLines.length * lineHeight
      
      // Customer Signature Section (Professional Style)
      if (additional_data?.signature) {
        checkPageBreak(12)
        
        // // Signature Heading
        // doc.setFontSize(12)
        // doc.setFont(undefined, "bold")
        // doc.setTextColor("#000000")
        // doc.text("CUSTOMER SIGNATURE", margin, yPosition)
        // yPosition += 8
        
        // Signature Image
        try {
          doc.addImage(`data:image/png;base64,${additional_data.signature}`, "PNG", margin, yPosition, 100, 40)
          yPosition += 45
        } catch (e) {
          doc.setFontSize(10)
          doc.setFont(undefined, "normal")
          doc.setTextColor("#666666")
          doc.text("Digital signature on file", margin, yPosition)
          yPosition += 10
        }
        
        // Signed by and Timestamp
        yPosition += 3
        doc.setFontSize(10)
        doc.setFont(undefined, "normal")
        doc.setTextColor("#000000")
        
        // Signed by
        if (contact && (contact?.first_name || contact?.last_name || contact?.email)) {
          const signedByName = toTitleCase([contact?.first_name, contact?.last_name].filter(Boolean).join(' ')) || contact?.email || 'Customer'
          doc.text(`Signed by: ${signedByName}`, margin, yPosition)
          yPosition += 5
        }
        
        // Date and Time
        doc.text(`Date: ${agreementDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, yPosition)
        yPosition += 5
        doc.text(`Time: ${agreementDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`, margin, yPosition)
        yPosition += 10
        
        // Agreement Statement
        // doc.setFontSize(9)
        // doc.setFont(undefined, "normal")
        // doc.setTextColor("#4b5563")
        // doc.text("✓ I have read and agree to the Terms & Conditions and Privacy Policy", margin, yPosition)
      }
    }

    const timestamp = new Date().toISOString().split("T")[0]
    const companyName = import.meta.env.VITE_COMPANY_NAME || 'TruShine Window Cleaning'
    doc.save(`${companyName.replace(/\s+/g, '-')}-Quote-${quote.id}-${timestamp}.pdf`)
  } catch (error) {
    alert("Failed to generate PDF. Please try again.")
    console.error('Error generating PDF:', error)
  } finally {
    setIsGeneratingPDF(false)
  }
}
