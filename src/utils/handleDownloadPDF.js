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
    const subtotal = totalServicePrice
    const adjustment = subtotal < (globalPriceData?.base_price || 0) ? (globalPriceData?.base_price || 0) - subtotal : 0
    const final = subtotal + adjustment
    const taxRate = parseFloat(import.meta.env.VITE_TAX_RATE) || 0.0825
    const taxAmount = final * taxRate
    const finalWithTax = final + taxAmount

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
    checkPageBreak(1)
    doc.text("Adjustments", margin, yPosition)
    doc.text(formatPrice(adjustment), pageWidth - margin - 40, yPosition)
    yPosition += 6

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
    if (quote?.status === "accepted") {
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
      
      // Terms Content
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("GENERAL TERMS", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const generalTerms = [
        "• Any special accommodations must be reviewed and approved by TWC management before accepting the proposal.",
        "• Quotations are valid for 30 days and must be accepted in writing (signature or electronic acceptance).",
        "• All work will be completed in a professional, workmanlike manner, in compliance with local codes/regulations.",
        "• TWC is properly insured against injury to employees and losses from employee actions.",
        "• TWC reserves the right to update these Terms and Conditions at any time."
      ]
      generalTerms.forEach(term => {
        checkPageBreak(4)
        const lines = doc.splitTextToSize(term, maxLineWidth - 5)
        doc.text(lines, margin + 5, yPosition)
        yPosition += lines.length * lineHeight + 2
      })
      
      yPosition += 5
      checkPageBreak(6)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("WINDOW CLEANING", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const windowCleaningTerms = [
        "• All windows must be securely closed on the day of service.",
        "• Client responsible for ensuring items are structurally sound. TWC may document/refuse questionable items.",
        "• Full access required; obstacles will not be moved. $75 trip fee if no access available.",
        "• Unsafe/inaccessible windows will not be cleaned.",
        "• External glass cleaned with water-fed pole using pure water, left to dry naturally.",
        "• \"Window\" includes frame, sill, sash, and glass (wood, aluminum, steel, UPVC). Brick/tile/stone sills excluded.",
        "• 36-hour Streak-Free Guarantee on all window cleaning packages."
      ]
      windowCleaningTerms.forEach(term => {
        checkPageBreak(4)
        const lines = doc.splitTextToSize(term, maxLineWidth - 5)
        doc.text(lines, margin + 5, yPosition)
        yPosition += lines.length * lineHeight + 2
      })
      
      yPosition += 5
      checkPageBreak(6)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("PRESSURE WASHING", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const pressureWashingTerms = [
        "• Pressure washing removes most stains; some marks may remain.",
        "• External water access is required.",
        "• Client must cover/remove outdoor furniture. $150 fee if TWC must do it. Not liable for chemical damage.",
        "• 3-day satisfaction guarantee on premium pressure washing packages only."
      ]
      pressureWashingTerms.forEach(term => {
        checkPageBreak(4)
        const lines = doc.splitTextToSize(term, maxLineWidth - 5)
        doc.text(lines, margin + 5, yPosition)
        yPosition += lines.length * lineHeight + 2
      })
      
      yPosition += 5
      checkPageBreak(6)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("GUTTER CLEANING", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const gutterCleaningTerms = [
        "• Basic cleaning includes clearing internal gutters only. Hauling debris/repairs not included unless agreed.",
        "• Cleaning done via leaf blower; downspouts flushed with hose.",
        "• Exterior gutter surface cleaning not included (available at additional cost).",
        "• 15-day guarantee on all gutter cleaning packages."
      ]
      gutterCleaningTerms.forEach(term => {
        checkPageBreak(4)
        const lines = doc.splitTextToSize(term, maxLineWidth - 5)
        doc.text(lines, margin + 5, yPosition)
        yPosition += lines.length * lineHeight + 2
      })
      
      yPosition += 5
      checkPageBreak(6)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("AWNING CLEANING", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const awningCleaningTerms = [
        "• TWC not liable for unexpected damage during awning cleaning.",
        "• Service may be declined if material is over 5 years old or fails inspection.",
        "• 24-hour guarantee on all awning cleaning services."
      ]
      awningCleaningTerms.forEach(term => {
        checkPageBreak(4)
        const lines = doc.splitTextToSize(term, maxLineWidth - 5)
        doc.text(lines, margin + 5, yPosition)
        yPosition += lines.length * lineHeight + 2
      })
      
      yPosition += 5
      checkPageBreak(6)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("RESCHEDULING, CANCELLATION & CLIENT RESPONSIBILITIES", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const reschedulingTerms = [
        "• Each client may reschedule up to 2 times, within 7 days of original date.",
        "• Rescheduling/cancellation within 8 hours: $35 fee.",
        "• More than 8 hours in advance: free (first 2 times).",
        "• Beyond 2 reschedules may incur full service amount fee.",
        "• TruShine not liable for delays due to weather/supply/uncontrollable issues."
      ]
      reschedulingTerms.forEach(term => {
        checkPageBreak(4)
        const lines = doc.splitTextToSize(term, maxLineWidth - 5)
        doc.text(lines, margin + 5, yPosition)
        yPosition += lines.length * lineHeight + 2
      })
      
      yPosition += 5
      checkPageBreak(6)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("PAYMENTS", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const paymentTerms = [
        "• Payment due upon completion unless otherwise agreed.",
        "• TWC may require credit card info or $100 deposit. Jobs needing materials: 50% deposit.",
        "• Accepted: cash, check, credit card (in person, phone, or online).",
        "• Commercial account payments can be mailed to: 3525 Murdock ST, Houston, TX 77047.",
        "• Clients with unpaid balances may be denied further service.",
        "• Disputed payments are client's responsibility. Late/recovery fees may apply."
      ]
      paymentTerms.forEach(term => {
        checkPageBreak(4)
        const lines = doc.splitTextToSize(term, maxLineWidth - 5)
        doc.text(lines, margin + 5, yPosition)
        yPosition += lines.length * lineHeight + 2
      })
      
      yPosition += 5
      checkPageBreak(6)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("LATE FEES", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const lateFeeTerms = [
        "• Residential: 10% late fee after 1 day.",
        "• Commercial: 10% late fee after 30 days.",
        "• Balances unpaid after 60 days sent to collections (including legal fees)."
      ]
      lateFeeTerms.forEach(term => {
        checkPageBreak(4)
        const lines = doc.splitTextToSize(term, maxLineWidth - 5)
        doc.text(lines, margin + 5, yPosition)
        yPosition += lines.length * lineHeight + 2
      })
      
      yPosition += 5
      checkPageBreak(6)
      doc.setFontSize(11)
      doc.setFont(undefined, "bold")
      doc.setTextColor("#000000")
      doc.text("OTHER POLICIES", margin, yPosition)
      yPosition += 7
      
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor("#374151")
      const otherPolicyTerms = [
        "• All sales final. Refunds only for unused material during service.",
        "• 14-day written notice required for cancellation. Less notice = full charge.",
        "• All services subject to applicable Texas state TAX.",
        "• If a complaint revisit finds work satisfactory, $75 trip fee applies."
      ]
      otherPolicyTerms.forEach(term => {
        checkPageBreak(4)
        const lines = doc.splitTextToSize(term, maxLineWidth - 5)
        doc.text(lines, margin + 5, yPosition)
        yPosition += lines.length * lineHeight + 2
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
  } finally {
    setIsGeneratingPDF(false)
  }
}
