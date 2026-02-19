export const calendarStyles = `
  .rbc-calendar {
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: auto !important;
    overflow-y: visible !important;
  }
  @media (max-width: 639px) {
    .rbc-calendar {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
    }
  }
  .rbc-month-view {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 600px !important;
  }
  @media (min-width: 640px) {
    .rbc-month-view {
      min-width: 100% !important;
    }
  }
  .rbc-month-row {
    width: 100% !important;
    max-width: 100% !important;
  }
  .rbc-day-bg {
    width: 100% !important;
  }
  .rbc-header {
    width: 100% !important;
    padding: 8px 4px !important;
    font-size: 11px !important;
    font-weight: 600 !important;
  }
  @media (min-width: 640px) {
    .rbc-header {
      padding: 10px 8px !important;
      font-size: 14px !important;
    }
  }
  .rbc-date-cell {
    padding: 4px !important;
    font-size: 11px !important;
    font-weight: 600 !important;
  }
  @media (min-width: 640px) {
    .rbc-date-cell {
      padding: 6px !important;
      font-size: 13px !important;
    }
  }
  .rbc-event {
    border-radius: 6px !important;
    padding: 0 !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    box-shadow: none !important;
    border: none !important;
    outline: none !important;
    margin: 1px 0 !important;
    transition: all 0.2s ease !important;
    overflow: visible !important;
    cursor: pointer !important;
    pointer-events: auto !important;
  }
  @media (min-width: 640px) {
    .rbc-event {
      margin: 2px 0 !important;
    }
  }
  @media (min-width: 1024px) {
    .rbc-event {
      margin: 2px 0 !important;
    }
  }
  .rbc-event-wrapper {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    background: transparent !important;
    padding: 0 !important;
    border-radius: 6px !important;
    overflow: visible !important;
    pointer-events: auto !important;
    cursor: pointer !important;
  }
  .rbc-event-wrapper * {
    pointer-events: auto !important;
  }
  .rbc-event:hover {
    box-shadow: none !important;
    transform: translateY(-1px) !important;
    border: none !important;
    outline: none !important;
    z-index: 10 !important;
  }
  .rbc-event:hover .rbc-event-content {
    box-shadow: none !important;
  }
  .rbc-event-content {
    line-height: 1.3 !important;
    overflow: visible !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    border: none !important;
    outline: none !important;
    padding: 4px 6px !important;
    border-radius: 6px !important;
    box-shadow: none !important;
    min-height: 20px !important;
    display: flex !important;
    align-items: center !important;
    font-size: 13px !important;
  }
  @media (min-width: 640px) {
    .rbc-event-content {
      padding: 5px 8px !important;
      min-height: 24px !important;
    }
  }
  @media (min-width: 1024px) {
    .rbc-event-content {
      padding: 6px 10px !important;
      min-height: 28px !important;
    }
  }
  .rbc-event-content-responsive {
    padding: 4px 6px !important;
    font-size: 13px !important;
    min-height: 20px !important;
    box-shadow: none !important;
    pointer-events: auto !important;
    cursor: pointer !important;
  }
  .rbc-event-content-responsive,
  .rbc-event-content-responsive span,
  .rbc-event-content-responsive * {
    font-size: 13px !important;
  }
  .rbc-event-content-responsive span,
  .rbc-event-content-responsive * {
    pointer-events: none !important;
  }
  @media (min-width: 640px) {
    .rbc-event-content-responsive {
      padding: 5px 8px !important;
      font-size: 13px !important;
      min-height: 24px !important;
    }
    .rbc-event-content-responsive,
    .rbc-event-content-responsive span,
    .rbc-event-content-responsive * {
      font-size: 13px !important;
    }
    .rbc-event-content-responsive span,
    .rbc-event-content-responsive * {
      pointer-events: none !important;
    }
  }
  @media (min-width: 1024px) {
    .rbc-event-content-responsive {
      padding: 6px 10px !important;
      font-size: 13px !important;
      min-height: 28px !important;
    }
    .rbc-event-content-responsive,
    .rbc-event-content-responsive span,
    .rbc-event-content-responsive * {
      font-size: 13px !important;
    }
    .rbc-event-content-responsive span,
    .rbc-event-content-responsive * {
      pointer-events: none !important;
    }
  }
  .rbc-event-content-responsive .recurring-indicator {
    font-size: 11px !important;
  }
  /* Mobile-specific improvements - Google Calendar style */
  @media (max-width: 639px) {
    .rbc-event {
      width: 100% !important;
      min-width: 100% !important;
      margin: 1px 0 !important;
      border-radius: 4px !important;
    }
  .rbc-event-wrapper {
    width: 100% !important;
    min-width: 100% !important;
    pointer-events: auto !important;
    cursor: pointer !important;
  }
    .rbc-event-content-responsive {
      padding: 4px 6px !important;
      font-size: 10px !important;
      min-height: 20px !important;
      line-height: 1.2 !important;
      width: 100% !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      justify-content: center !important;
    }
    .rbc-event-content-responsive .truncate {
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      line-height: 1.2 !important;
      display: block !important;
      text-align: center !important;
      font-size: 10px !important;
      font-weight: 500 !important;
      pointer-events: none !important;
    }
    .rbc-event-content-responsive span,
    .rbc-event-content-responsive * {
      pointer-events: none !important;
    }
    .rbc-event-content-responsive,
    .rbc-event-content-responsive span:not(.recurring-indicator) {
      font-size: 10px !important;
      font-weight: 500 !important;
    }
    .rbc-event-content-responsive .recurring-indicator {
      font-size: 8px !important;
      margin-left: 2px !important;
      font-weight: 600 !important;
    }
    .rbc-month-view .rbc-day-bg {
      min-height: 50px !important;
    }
    .rbc-month-row {
      min-height: 50px !important;
    }
    .rbc-date-cell {
      padding: 2px 4px !important;
      font-size: 11px !important;
    }
    .rbc-header {
      padding: 8px 4px !important;
      font-size: 11px !important;
    }
  }
  .rbc-event-label {
    display: none !important;
  }
  .rbc-day-slot .rbc-time-slot {
    border-top: none !important;
  }
  .rbc-time-slot {
    border-top: 1px solid #f0f0f0 !important;
  }
  .rbc-event-selected {
    border: none !important;
    outline: none !important;
  }
  .rbc-event:focus {
    border: none !important;
    outline: none !important;
  }
  .rbc-event.rbc-selected {
    border: none !important;
    outline: none !important;
  }
  .rbc-day-slot .rbc-event {
    border: none !important;
    outline: none !important;
    margin: 0 !important;
  }
  .rbc-month-view .rbc-event {
    border: none !important;
    outline: none !important;
    margin: 0 !important;
  }
  .rbc-month-view .rbc-day-slot .rbc-event {
    margin: 0 !important;
  }
  .rbc-day-slot .rbc-events-container {
    margin: 0 !important;
  }
  .rbc-day-slot .rbc-events-container .rbc-event {
    margin: 0 !important;
  }
  .rbc-day-bg {
    overflow: visible !important;
  }
  .rbc-day-slot {
    overflow: visible !important;
  }
  .rbc-date-cell {
    overflow: visible !important;
  }
  .rbc-month-view .rbc-day-bg {
    overflow: visible !important;
  }
  .rbc-month-view .rbc-day-slot {
    overflow: visible !important;
  }
  .rbc-month-view .rbc-date-cell {
    overflow: visible !important;
  }
  .rbc-month-row {
    overflow: visible !important;
  }
  .rbc-month-view .rbc-month-row {
    overflow: visible !important;
  }
  .rbc-row-content {
    overflow: visible !important;
  }
  .rbc-month-view .rbc-row-content {
    overflow: visible !important;
  }
  .rbc-day-bg {
    position: relative !important;
  }
  .rbc-month-view .rbc-day-bg {
    position: relative !important;
  }
  .rbc-month-view .rbc-day-bg.has-daily-total {
    overflow: visible !important;
  }
  @media (min-width: 640px) {
    .rbc-month-view .rbc-day-bg.has-daily-total {
      display: flex !important;
      flex-direction: column !important;
    }
    .rbc-month-view .rbc-day-bg.has-daily-total .rbc-events-container {
      flex: 1 1 auto !important;
      overflow: visible !important;
    }
  }
  @media (max-width: 639px) {
    .rbc-month-view .rbc-day-bg.has-daily-total {
      min-height: auto !important;
      padding-bottom: 0 !important;
      display: block !important;
    }
  }
  .rbc-month-view .rbc-row-content {
    overflow: visible !important;
  }
  .rbc-month-row {
    overflow: visible !important;
  }
  .rbc-month-view .rbc-day-slot {
    position: relative !important;
  }
  .rbc-month-view .rbc-events-container {
    position: relative !important;
  }
  .daily-job-total {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    letter-spacing: 0.01em !important;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: none !important;
    white-space: nowrap !important;
  }
  /* Day/Week resource view: one column per technician (resourceGroupingLayout) */
  .rbc-time-view-resources .rbc-time-header-content .rbc-row.rbc-row-resource .rbc-header,
  .rbc-time-view-resources .rbc-resource-grouping .rbc-header {
    padding: 8px 10px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    border-left: 1px solid var(--rbc-border, #ddd) !important;
    min-width: 120px !important;
  }
  .rbc-time-view-resources .rbc-time-content {
    display: flex !important;
    overflow-x: auto !important;
  }
  /* Range-first layout: one flex row per date, columns = resources; align with header */
  .rbc-time-view-resources .rbc-time-content > div {
    display: flex !important;
    flex: 1 !important;
    min-width: 0 !important;
  }
  .rbc-time-view-resources .rbc-time-content .rbc-day-slot {
    flex: 1 1 0% !important;
    min-width: 120px !important;
  }
  .rbc-time-view-resources .rbc-time-gutter {
    flex-shrink: 0 !important;
  }
  .rbc-time-view-resources .rbc-time-header-gutter {
    min-width: 50px !important;
  }
  .rbc-time-view-resources .rbc-time-header-content.rbc-resource-grouping {
    flex: 1 1 0% !important;
    min-width: 120px !important;
  }
  /* Time column: reduce width so more space for technician columns */
  .rbc-time-gutter,
  .rbc-time-view-resources .rbc-time-gutter {
    max-width: 52px !important;
    min-width: 44px !important;
    width: 48px !important;
  }
  .rbc-time-header-gutter,
  .rbc-time-view-resources .rbc-time-header-gutter,
  .rbc-label.rbc-time-header-gutter {
    max-width: 52px !important;
    min-width: 44px !important;
    width: 48px !important;
  }
  @media (max-width: 639px) {
    .rbc-time-gutter,
    .rbc-time-view-resources .rbc-time-gutter {
      max-width: 44px !important;
      min-width: 38px !important;
      width: 42px !important;
    }
    .rbc-time-header-gutter,
    .rbc-time-view-resources .rbc-time-header-gutter,
    .rbc-label.rbc-time-header-gutter {
      max-width: 44px !important;
      min-width: 38px !important;
      width: 42px !important;
    }
  }
  /* Events above time column (time gutter has z-index 10) */
  .rbc-time-view .rbc-day-slot .rbc-event-wrapper,
  .rbc-time-view .rbc-day-slot .rbc-event,
  .rbc-time-view .rbc-day-slot .rbc-events-container .rbc-event {
    z-index: 15 !important;
    position: relative !important;
  }
  .rbc-time-view .rbc-day-slot .rbc-events-container {
    z-index: 5 !important;
  }
  /* Mobile styles - top left position */
  @media (max-width: 639px) {
    .daily-job-total {
      position: absolute !important;
      top: 2px !important;
      left: 2px !important;
      z-index: 999 !important;
      max-width: calc(100% - 4px) !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      font-size: 7px !important;
      font-weight: 700 !important;
      color: #111827 !important;
      padding: 2px 4px !important;
      margin: 0 !important;
      text-align: left !important;
    }
    .rbc-month-view .rbc-day-bg.has-daily-total {
      position: relative !important;
      overflow: visible !important;
    }
    .rbc-month-view .rbc-date-cell {
      z-index: 1 !important;
      position: relative !important;
    }
  }
  /* Desktop styles - top left position */
  @media (min-width: 640px) {
    .daily-job-total {
      position: absolute !important;
      top: 2px !important;
      left: 2px !important;
      z-index: 999 !important;
      max-width: calc(100% - 4px) !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      font-size: 10px !important;
      font-weight: 700 !important;
      color: #111827 !important;
      padding: 2px 4px !important;
      margin: 0 !important;
      text-align: left !important;
    }
    .rbc-month-view .rbc-day-bg.has-daily-total {
      position: relative !important;
      overflow: visible !important;
    }
    .rbc-month-view .rbc-date-cell {
      z-index: 1 !important;
      position: relative !important;
    }
  }
  .rbc-month-view .rbc-day-bg.has-daily-total .rbc-events-container {
    margin-bottom: 0 !important;
  }
  .rbc-month-view .rbc-events-container {
    padding: 2px 1px !important;
    position: relative !important;
  }
  .rbc-month-view .rbc-day-bg {
    padding: 2px !important;
  }
  .rbc-month-view .rbc-event {
    position: relative !important;
    z-index: 2 !important;
  }
`;
