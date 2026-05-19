"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  Tooltip,
  IconButton,
  Popover,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material"
import { Info } from "@mui/icons-material"
import { useCreateQuestionPricingMutation } from "../../../../store/api/questionsApi"
import { useCreateOptionPricingMutation } from "../../../../store/api/optionPricing"
import { servicesApi } from "../../../../store/api/servicesApi"
import { useDispatch } from "react-redux"
import { useCreateSubQuestionPricingMutation } from "../../../../store/api/questionSubQuestionsApi"
import { useMoneyFormatter } from "../../../../hooks/useMoneyFormatter"

// Returns { priceType, amountType }. amountType: "dollar" | "percent" (percent only for percent-of-total types)
const mapFromApiPricingType = (apiType) => {
  switch (apiType) {
    case "upcharge_percent_of_total":
      return { priceType: "upcharge", amountType: "percent" }
    case "discount_percent_of_total":
      return { priceType: "discount", amountType: "percent" }
    case "upcharge_percent":
      return { priceType: "upcharge", amountType: "dollar" }
    case "discount_percent":
      return { priceType: "discount", amountType: "dollar" }
    case "fixed_price":
      return { priceType: "bid_in_person", amountType: "dollar" }
    case "ignore":
    default:
      return { priceType: "ignore", amountType: "dollar" }
  }
}

// Helper to flatten nested questions for easier state management
const flattenQuestions = (questionsArray) => {
  let allQuestions = []
  questionsArray.forEach((q) => {
    allQuestions.push(q)
    if (q.sub_questions && q.sub_questions.length > 0) {
      allQuestions = allQuestions.concat(flattenQuestions(q.sub_questions))
    }
    if (q.child_questions && q.child_questions.length > 0) {
      allQuestions = allQuestions.concat(flattenQuestions(q.child_questions))
    }
  })
  return allQuestions
}

const PriceSetupForm = ({ data, onUpdate }) => {
  const { currencySymbol } = useMoneyFormatter()
  const packages = data.packages || []
  const topLevelQuestions = data.questions || []

  // Flatten all questions for easier state management
  const flattenedQuestions = useMemo(() => flattenQuestions(topLevelQuestions), [topLevelQuestions])

  const [priceRules, setPriceRules] = useState(() => {
    const allRules = []
    flattenedQuestions.forEach((question) => {
      if (question.question_type === "multiple_yes_no") {
        question.sub_questions?.forEach((subQ) => {
          subQ.pricing_rules?.forEach((rule) => {
            const { priceType, amountType } = mapFromApiPricingType(rule.yes_pricing_type)
            allRules.push({
              questionId: subQ.id, // Use sub_question ID for multiple_yes_no sub-questions
              packageId: rule.package,
              answer: "yes", // Assuming sub-questions are always yes/no
              priceType,
              amountType: amountType || "dollar",
              value: Number.parseFloat(rule.yes_value) || 0,
            })
          })
        })
      } else {
        question.pricing_rules?.forEach((rule) => {
          if (question.question_type === "yes_no") {
            const { priceType, amountType } = mapFromApiPricingType(rule.yes_pricing_type)
            allRules.push({
              questionId: question.id,
              packageId: rule.package,
              answer: "yes",
              priceType,
              amountType: amountType || "dollar",
              value: Number.parseFloat(rule.yes_value) || 0,
            })
          } else if (question.options && question.options.length > 0) {
            const matchedOption = question.options.find((opt) => opt.id === rule.option)
            if (matchedOption) {
              const { priceType, amountType } = mapFromApiPricingType(rule.pricing_type)
              allRules.push({
                questionId: question.id,
                packageId: rule.package,
                optionId: matchedOption.id,
                priceType,
                amountType: amountType || "dollar",
                value: Number.parseFloat(rule.value) || 0,
              })
            }
          }
        })
      }
    })
    return allRules
  })

  const [changedQuestions, setChangedQuestions] = useState({})
  const [popoverAnchor, setPopoverAnchor] = useState({
    element: null,
    questionId: "",
    packageId: "",
    answer: undefined,
    optionId: undefined,
  })
  // Extra amount per question, package AND option: { [questionId]: { [packageId]: { [optionKey]: { mode, value } } } }
  // optionKey = for yes_no: question.id, multiple_yes_no: sub_question.id, options: option.id
  const [extraAmountByQuestionAndPackageAndOption, setExtraAmountByQuestionAndPackageAndOption] = useState({})

  const [createQuestionPricing, { isLoading }] = useCreateQuestionPricingMutation()
  const [createOptionPricing] = useCreateOptionPricingMutation()
  const [createSubQuestionPricing] = useCreateSubQuestionPricingMutation()
  const dispatch = useDispatch()

  useEffect(() => {
    const rules = []
    flattenedQuestions.forEach((question) => {
      packages.forEach((pkg) => {
        if (question.question_type === "yes_no") {
          // For simple yes_no, we create a rule for the 'yes' answer
          const existingRule = priceRules.find(
            (r) => r.questionId === question.id && r.packageId === pkg.id && r.answer === "yes",
          )
          rules.push(
            existingRule || {
              questionId: question.id,
              packageId: pkg.id,
              answer: "yes",
              priceType: "ignore",
              amountType: "dollar",
              value: 0,
            },
          )
        } else if (question.question_type === "multiple_yes_no") {
          // For multiple_yes_no, rules are tied to sub_question.id
          question.sub_questions?.forEach((subQ) => {
            const existingRule = priceRules.find(
              (r) => r.questionId === subQ.id && r.packageId === pkg.id && r.answer === "yes",
            )
            rules.push(
              existingRule || {
                questionId: subQ.id, // Use sub_question ID here
                packageId: pkg.id,
                answer: "yes",
                priceType: "ignore",
                amountType: "dollar",
                value: 0,
              },
            )
          })
        } else if (question.options && question.options.length > 0) {
          // For questions with options (describe, multiple_choice, conditional child questions with options)
          question.options.forEach((option) => {
            const existingRule = priceRules.find(
              (r) => r.questionId === question.id && r.packageId === pkg.id && r.optionId === option.id,
            )
            rules.push(
              existingRule || {
                questionId: question.id,
                packageId: pkg.id,
                optionId: option.id,
                priceType: "ignore",
                amountType: "dollar",
                value: 0,
              },
            )
          })
        }
      })
    })
    setPriceRules(rules)
  }, [flattenedQuestions, packages])

  const isValueEditable = (priceType) => !["ignore", "bid_in_person"].includes(priceType)

  // Get effective price in dollars from a rule (for display and for "add extra" math)
  const getCurrentPriceDollars = (rule, base) => {
    if (!rule?.priceType) return 0
    const v = Number(rule.value) || 0
    const b = Number(base) || 0
    if (rule.priceType === "upcharge") return b * (1 + v / 100)
    if (rule.priceType === "discount") return Math.max(0, b * (1 - v / 100))
    if (rule.priceType === "bid_in_person" || rule.priceType === "fixed") return v
    return 0
  }

  // Convert a target price (in dollars) back to stored value for the given price type
  const getStoredValueFromPriceDollars = (priceType, priceDollars, base) => {
    const p = Math.max(0, Number(priceDollars) || 0)
    const b = Number(base) || 0
    if (priceType === "upcharge" && b > 0) return ((p / b) - 1) * 100
    if (priceType === "discount" && b > 0) return Math.max(0, Math.min(100, (1 - p / b) * 100))
    if (priceType === "bid_in_person" || priceType === "fixed") return p
    return 0
  }

  const updatePriceRule = (questionId, packageId, field, value, answer, optionId) => {
    setPriceRules((prevRules) =>
      prevRules.map((rule) => {
        const matches =
          rule.questionId === questionId &&
          rule.packageId === packageId &&
          rule.answer === answer &&
          rule.optionId === optionId
        if (matches) {
          return { ...rule, [field]: value }
        }
        return rule
      }),
    )

    // Find the actual question object that was modified (could be a sub-question or child question)
    const modifiedQuestion = flattenedQuestions.find((q) => q.id === questionId)

    let topLevelQuestionIdToMarkChanged = questionId // Default to itself

    if (modifiedQuestion) {
      // Find the immediate parent in the flattened list that has this question as a child/sub-question
      const parentQuestion = flattenedQuestions.find(
        (q) =>
          (q.sub_questions && q.sub_questions.some((subQ) => subQ.id === modifiedQuestion.id)) ||
          (q.child_questions && q.child_questions.some((childQ) => childQ.id === modifiedQuestion.id)),
      )

      if (parentQuestion) {
        topLevelQuestionIdToMarkChanged = parentQuestion.id
      }
    }

    setChangedQuestions((prev) => ({
      ...prev,
      [topLevelQuestionIdToMarkChanged]: true,
    }))
  }

  const getPriceRule = (questionId, packageId, answer, optionId) => {
    return priceRules.find(
      (r) => r.questionId === questionId && r.packageId === packageId && r.answer === answer && r.optionId === optionId,
    )
  }

  // Get all rules that belong to this question's table (optionally filtered by packageId and/or optionKey)
  const getRulesForQuestion = (question, packageId = null, optionKey = null) => {
    let rules
    if (question.question_type === "multiple_yes_no" && question.sub_questions?.length) {
      const subIds = question.sub_questions.map((s) => s.id)
      rules = priceRules.filter((r) => subIds.includes(r.questionId) && r.answer === "yes")
      if (optionKey != null) rules = rules.filter((r) => r.questionId === optionKey)
    } else if (question.question_type === "yes_no") {
      rules = priceRules.filter((r) => r.questionId === question.id && r.answer === "yes")
      if (optionKey != null) rules = rules.filter((r) => r.questionId === optionKey)
    } else if (question.options?.length) {
      rules = priceRules.filter(
        (r) => r.questionId === question.id && question.options.some((opt) => opt.id === r.optionId),
      )
      if (optionKey != null) rules = rules.filter((r) => r.optionId === optionKey)
    } else {
      rules = []
    }
    if (packageId) rules = rules.filter((r) => r.packageId === packageId)
    return rules
  }

  const handleApplyExtraAmount = (question, packageId, optionKey) => {
    const extra = getExtraAmount(question.id, packageId, optionKey)
    if (!extra || (extra.value !== 0 && extra.value !== "0" && !extra.value)) return
    const rulesToUpdate = getRulesForQuestion(question, packageId, optionKey).filter((r) => isValueEditable(r.priceType))
    const mode = extra.mode || "percent"
    const amount = Number(extra.value) || 0
    if (!rulesToUpdate.length) return
    const pkg = packages.find((p) => p.id === packageId)
    const base = pkg?.base_price != null ? Number(pkg.base_price) : 0
    rulesToUpdate.forEach((rule) => {
      const currentStored = Number(rule.value) || 0
      let newValue
      if (mode === "dollar") {
        // Add dollar amount directly to the value in the cell: 10 + 10 = 20
        newValue = currentStored + amount
      } else {
        // Add percentage to the value in the cell: 20 + 10% = 20 * (1 + 10/100) = 22
        newValue = currentStored * (1 + amount / 100)
      }
      newValue = Math.max(0, Math.round(newValue * 100) / 100)
      updatePriceRule(rule.questionId, rule.packageId, "value", newValue, rule.answer, rule.optionId)
    })
    setChangedQuestions((prev) => ({ ...prev, [question.id]: true }))
  }

  const setExtraAmount = (questionId, packageId, optionKey, field, value) => {
    setExtraAmountByQuestionAndPackageAndOption((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        [packageId]: {
          ...(prev[questionId]?.[packageId] || {}),
          [optionKey]: { ...(prev[questionId]?.[packageId]?.[optionKey] || { mode: "percent", value: "" }), [field]: value },
        },
      },
    }))
  }

  const getExtraAmount = (questionId, packageId, optionKey) => {
    if (optionKey == null) return { mode: "percent", value: "" }
    return extraAmountByQuestionAndPackageAndOption[questionId]?.[packageId]?.[optionKey] || { mode: "percent", value: "" }
  }

  const handlePopoverOpen = (event, questionId, packageId, answer, optionId) => {
    setPopoverAnchor({
      element: event.currentTarget,
      questionId,
      packageId,
      answer,
      optionId,
    })
  }

  const handlePopoverClose = () => {
    setPopoverAnchor({
      element: null,
      questionId: "",
      packageId: "",
      answer: undefined,
      optionId: undefined,
    })
  }

  const handlePriceTypeSelect = (priceType) => {
    updatePriceRule(
      popoverAnchor.questionId,
      popoverAnchor.packageId,
      "priceType",
      priceType,
      popoverAnchor.answer,
      popoverAnchor.optionId,
    )
    handlePopoverClose()
  }

  const getPriceTypeIcon = (priceType) => {
    switch (priceType) {
      case "upcharge":
        return "+"
      case "discount":
        return "-"
      case "bid_in_person":
        return "?"
      default:
        return "○"
    }
  }

  const getPriceTypeColor = (priceType) => {
    switch (priceType) {
      case "upcharge":
        return "success.main"
      case "discount":
        return "warning.main"
      case "bid_in_person":
        return "info.main"
      default:
        return "grey.400"
    }
  }

  // amountType "percent" + upcharge/discount → percent-of-total; otherwise current API (dollar/fixed/ignore)
  const mapToApiPricingType = (type, amountType = "dollar") => {
    if (amountType === "percent") {
      if (type === "upcharge") return "upcharge_percent_of_total"
      if (type === "discount") return "discount_percent_of_total"
    }
    switch (type) {
      case "upcharge":
        return "upcharge_percent"
      case "discount":
        return "discount_percent"
      case "fixed":
      case "bid_in_person":
        return "fixed_price"
      case "ignore":
      default:
        return "ignore"
    }
  }

  const formatRuleForPayload = (rule) => {
    const isZeroed = ["ignore", "bid_in_person"].includes(rule.priceType)
    const rawValue = isZeroed ? 0 : rule.value || 0
    return {
      package_id: rule.packageId,
      pricing_type: mapToApiPricingType(rule.priceType, rule.amountType || "dollar"),
      value: rawValue.toFixed(2),
    }
  }

  const handleSave = async (questionId, isRecursiveCall = false) => {
    const questionToSave = flattenedQuestions.find((q) => q.id === questionId)
    if (!questionToSave) return

    try {
      if (questionToSave.question_type === "yes_no") {
        // This handles simple yes_no questions (top-level or conditional child)
        const rulesToSave = priceRules.filter((r) => r.questionId === questionId)
        const pricing_rules = rulesToSave.map(formatRuleForPayload)
        const payload = {
          question_id: questionId, // Default for top-level yes_no or conditional child yes_no
          pricing_rules,
        }
        // Adjust payload key if it's a conditional child question (as per user's example)
        // if (questionToSave.is_conditional && questionToSave.parent_question) {
        //   payload.question = questionId // Use 'question' key for conditional child
        //   delete payload.question_id
        // }
        await createQuestionPricing(payload).unwrap() // Use createQuestionPricing for yes_no types (including conditional children)
      } else if (questionToSave.question_type === "multiple_yes_no") {
        // This handles multiple_yes_no questions and their sub_questions
        const subQuestions = questionToSave.sub_questions || []
        for (const subQ of subQuestions) {
          const subQRules = priceRules.filter((r) => r.questionId === subQ.id) // Rules are tied to sub_question ID
          const pricing_rules = subQRules.map(formatRuleForPayload)
          const payload = {
            sub_question_id: subQ.id, // Use 'sub_question_id' key for sub-questions
            pricing_rules,
          }
          await createSubQuestionPricing(payload).unwrap()
        }
      } else if (questionToSave.question_type === "conditional") {
        // This handles conditional questions by recursively saving their child_questions
        const childQuestions = questionToSave.child_questions || []
        for (const childQ of childQuestions) {
          await handleSave(childQ.id, true) // Pass true for recursive calls
        }
      } else if (questionToSave.options && questionToSave.options.length > 0) {
        // This handles questions with options (e.g., describe, multiple_choice)
        // This applies to top-level, sub-questions, and conditional child questions with options
        const options = questionToSave.options || []
        for (const opt of options) {
          const optionRules = priceRules.filter((r) => r.questionId === questionId && r.optionId === opt.id) // Filter by current questionId and optionId
          const pricing_rules = optionRules.map(formatRuleForPayload)
          const payload = {
            option_id: opt.id,
            pricing_rules,
          }
          await createOptionPricing(payload).unwrap()
        }
      }

      // Only perform these actions if it's the initial call (not a recursive one)
      if (!isRecursiveCall) {
        const fullServiceData = await dispatch(
          servicesApi.endpoints.getServiceById.initiate(data.id, { forceRefetch: true }),
        ).unwrap()
        onUpdate(fullServiceData)
        setChangedQuestions((prev) => ({ ...prev, [questionId]: false })) // Clear the flag for the top-level question
        alert("Pricing saved successfully!")
      }
    } catch (err) {
      // Error handling should also be conditional or handled differently for recursive calls
      if (!isRecursiveCall) {
        alert("Failed to save pricing. Please try again.")
      }
      // Re-throw the error so the parent conditional can catch it if needed
      throw err
    }
  }

  // Recursive rendering function for questions and their nested children
  const renderQuestionTable = (question, level = 0) => {
    const questionDisplayTitle = question.question_text || question.sub_question_text

    // Conditional questions are special: they don't have their own pricing table,
    // but act as containers for child questions based on conditions.
    if (question.question_type === "conditional") {
      return (
        <Box key={question.id} mb={4} pl={level * 2}>
          <Typography variant="subtitle1" fontWeight="bold" fontSize={30} mb={2}>
            {questionDisplayTitle}
          </Typography>
          {/* Assuming 'If Yes' is the primary condition for display based on the image */}
          <Box mt={2} mb={2} p={2} border={1} borderColor="grey.300" borderRadius={1}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              If Yes
            </Typography>
            {question.child_questions && question.child_questions.length > 0 && (
              <Box>{question.child_questions.map((childQ) => renderQuestionTable(childQ, level + 1))}</Box>
            )}
          </Box>
          <Box display="flex" justifyContent="flex-end" mt={1}>
            <Button
              variant="contained"
              color="primary"
              disabled={!changedQuestions[question.id] || isLoading}
              onClick={() => handleSave(question.id)}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </Box>
        </Box>
      )
    }

    // For all other question types (yes_no, multiple_yes_no, describe, multiple_choice, etc.)
    // and for child questions of conditional types.
    return (
      <Box key={question.id} mb={4} pl={level * 2}>
        <Typography variant="subtitle1" fontWeight="bold" fontSize={30} mb={2}>
          {questionDisplayTitle}
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 140 }}>Options</TableCell>
                {packages.map((pkg) => (
                  <TableCell key={pkg.id} align="center" sx={{ width: 180, minWidth: 180 }}>
                    {pkg.name}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Handle yes_no and multiple_yes_no questions */}
              {question.question_type === "yes_no" || question.question_type === "multiple_yes_no"
                ? (question.question_type === "multiple_yes_no" &&
                  question.sub_questions &&
                  question.sub_questions.length > 0
                    ? question.sub_questions
                    : [{ id: question.id, sub_question_text: `If Yes` }]
                  ) // For simple yes_no, treat it as a single item
                    .map((item) => {
                      const currentQuestionId = item.id
                      const rowLabel = item.sub_question_text || `For: "Yes":` // optionKey for this row
                      const optionKey = item.id

                      return (
                        <React.Fragment key={currentQuestionId}>
                          <TableRow>
                            <TableCell sx={{ verticalAlign: "middle" }}>{rowLabel}</TableCell>
                            {packages.map((pkg) => {
                              const rule = getPriceRule(currentQuestionId, pkg.id, "yes", undefined)
                              return (
                                <TableCell key={pkg.id} align="center" sx={{ verticalAlign: "middle", width: 180, minWidth: 180 }}>
                                  <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                    {isValueEditable(rule?.priceType) && (
                                      <FormControl size="small" sx={{ minWidth: 48 }} variant="outlined">
                                        <Select
                                          value={rule?.amountType ?? "dollar"}
                                          onChange={(e) =>
                                            updatePriceRule(
                                              currentQuestionId,
                                              pkg.id,
                                              "amountType",
                                              e.target.value,
                                              "yes",
                                              undefined,
                                            )
                                          }
                                          sx={{ fontSize: "0.8rem", height: 32 }}
                                          label={null}
                                        >
                                          <MenuItem value="dollar" sx={{ fontSize: "0.8rem" }}>{currencySymbol}</MenuItem>
                                          <MenuItem value="percent" sx={{ fontSize: "0.8rem" }}>%</MenuItem>
                                        </Select>
                                      </FormControl>
                                    )}
                                    <TextField
                                      size="small"
                                      type="number"
                                      value={isValueEditable(rule?.priceType) ? (rule?.value ?? 0) : ""}
                                      onChange={(e) => {
                                        if (!isValueEditable(rule?.priceType)) return
                                        updatePriceRule(
                                          currentQuestionId,
                                          pkg.id,
                                          "value",
                                          Number(e.target.value),
                                          "yes",
                                          undefined,
                                        )
                                      }}
                                      disabled={!isValueEditable(rule?.priceType)}
                                      placeholder={!isValueEditable(rule?.priceType) ? "" : undefined}
                                      sx={{ width: 72, "& .MuiInputBase-input": { textAlign: "center" } }}
                                    />
                                    <IconButton
                                      size="small"
                                      onClick={(e) => handlePopoverOpen(e, currentQuestionId, pkg.id, "yes")}
                                      sx={{
                                        bgcolor: getPriceTypeColor(rule?.priceType || "ignore"),
                                        color: "white",
                                        width: 28,
                                        height: 28,
                                      }}
                                    >
                                      <Typography fontSize="small">{getPriceTypeIcon(rule?.priceType)}</Typography>
                                    </IconButton>
                                  </Box>
                                </TableCell>
                              )
                            })}
                          </TableRow>
                          {/* <TableRow sx={{ bgcolor: "grey.50" }}>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 500, fontSize: "0.75rem", py: 0.75, verticalAlign: "middle" }}>
                              Add to price
                            </TableCell>
                            {packages.map((pkg) => {
                              const extra = getExtraAmount(question.id, pkg.id, optionKey)
                              const hasEditableRule = getRulesForQuestion(question, pkg.id, optionKey).some((r) => isValueEditable(r.priceType))
                              return (
                                <TableCell key={pkg.id} align="center" sx={{ py: 0.75, verticalAlign: "middle", width: 180, minWidth: 180 }}>
                                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.75} flexWrap="nowrap">
                                    <FormControl size="small" sx={{ width: 56 }} variant="outlined">
                                      <Select
                                        value={extra.mode ?? "percent"}
                                        onChange={(e) => setExtraAmount(question.id, pkg.id, optionKey, "mode", e.target.value)}
                                        sx={{ fontSize: "0.75rem", height: 32 }}
                                        label={null}
                                      >
                                        <MenuItem value="dollar" sx={{ fontSize: "0.75rem" }}>{currencySymbol}</MenuItem>
                                        <MenuItem value="percent" sx={{ fontSize: "0.75rem" }}>%</MenuItem>
                                      </Select>
                                    </FormControl>
                                    <TextField
                                      size="small"
                                      type="number"
                                      placeholder="0"
                                      value={extra.value ?? ""}
                                      onChange={(e) => setExtraAmount(question.id, pkg.id, optionKey, "value", e.target.value)}
                                      inputProps={{ min: 0, step: extra.mode === "percent" ? 0.1 : 0.01 }}
                                      sx={{ width: 64, "& .MuiInputBase-input": { fontSize: "0.75rem", textAlign: "center" }, "& .MuiInputBase-root": { height: 32 } }}
                                    />
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      onClick={() => handleApplyExtraAmount(question, pkg.id, optionKey)}
                                      disabled={!hasEditableRule}
                                      sx={{ minWidth: 56, height: 32, fontSize: "0.75rem" }}
                                    >
                                      Apply
                                    </Button>
                                  </Box>
                                </TableCell>
                              )
                            })}
                          </TableRow> */}
                        </React.Fragment>
                      )
                    })
                : // Handle questions with options (describe, multiple_choice, etc.)
                  question.options && question.options.length > 0
                  ? question.options.map((option) => {
                      const optionKey = option.id
                      return (
                        <React.Fragment key={option.id}>
                          <TableRow>
                            <TableCell>{option.option_text}</TableCell>
                            {packages.map((pkg) => {
                              const rule = getPriceRule(question.id, pkg.id, undefined, option.id)
                              return (
                                <TableCell key={pkg.id} align="center" sx={{ verticalAlign: "middle", width: 180, minWidth: 180 }}>
                                  <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                    {isValueEditable(rule?.priceType) && (
                                      <FormControl size="small" sx={{ minWidth: 48 }} variant="outlined">
                                        <Select
                                          value={rule?.amountType ?? "dollar"}
                                          onChange={(e) =>
                                            updatePriceRule(
                                              question.id,
                                              pkg.id,
                                              "amountType",
                                              e.target.value,
                                              undefined,
                                              option.id,
                                            )
                                          }
                                          sx={{ fontSize: "0.8rem", height: 32 }}
                                          label={null}
                                        >
                                          <MenuItem value="dollar" sx={{ fontSize: "0.8rem" }}>{currencySymbol}</MenuItem>
                                          <MenuItem value="percent" sx={{ fontSize: "0.8rem" }}>%</MenuItem>
                                        </Select>
                                      </FormControl>
                                    )}
                                    <TextField
                                      size="small"
                                      type="number"
                                      value={isValueEditable(rule?.priceType) ? (rule?.value ?? 0) : ""}
                                      onChange={(e) => {
                                        if (!isValueEditable(rule?.priceType)) return
                                        updatePriceRule(
                                          question.id,
                                          pkg.id,
                                          "value",
                                          Number(e.target.value),
                                          undefined,
                                          option.id,
                                        )
                                      }}
                                      disabled={!isValueEditable(rule?.priceType)}
                                      placeholder={!isValueEditable(rule?.priceType) ? "" : undefined}
                                      sx={{ width: 72, "& .MuiInputBase-input": { textAlign: "center" } }}
                                    />
                                    <IconButton
                                      size="small"
                                      onClick={(e) => handlePopoverOpen(e, question.id, pkg.id, undefined, option.id)}
                                      sx={{
                                        bgcolor: getPriceTypeColor(rule?.priceType || "ignore"),
                                        color: "white",
                                        width: 28,
                                        height: 28,
                                      }}
                                    >
                                      <Typography fontSize="small">{getPriceTypeIcon(rule?.priceType)}</Typography>
                                    </IconButton>
                                  </Box>
                                </TableCell>
                              )
                            })}
                          </TableRow>
                          {/* <TableRow sx={{ bgcolor: "grey.50" }}>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 500, fontSize: "0.75rem", py: 0.75, verticalAlign: "middle" }}>
                              Add to price
                            </TableCell>
                            {packages.map((pkg) => {
                              const extra = getExtraAmount(question.id, pkg.id, optionKey)
                              const hasEditableRule = getRulesForQuestion(question, pkg.id, optionKey).some((r) => isValueEditable(r.priceType))
                              return (
                                <TableCell key={pkg.id} align="center" sx={{ py: 0.75, verticalAlign: "middle", width: 180, minWidth: 180 }}>
                                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.75} flexWrap="nowrap">
                                    <FormControl size="small" sx={{ width: 56 }} variant="outlined">
                                      <Select
                                        value={extra.mode ?? "percent"}
                                        onChange={(e) => setExtraAmount(question.id, pkg.id, optionKey, "mode", e.target.value)}
                                        sx={{ fontSize: "0.75rem", height: 32 }}
                                        label={null}
                                      >
                                        <MenuItem value="dollar" sx={{ fontSize: "0.75rem" }}>{currencySymbol}</MenuItem>
                                        <MenuItem value="percent" sx={{ fontSize: "0.75rem" }}>%</MenuItem>
                                      </Select>
                                    </FormControl>
                                    <TextField
                                      size="small"
                                      type="number"
                                      placeholder="0"
                                      value={extra.value ?? ""}
                                      onChange={(e) => setExtraAmount(question.id, pkg.id, optionKey, "value", e.target.value)}
                                      inputProps={{ min: 0, step: extra.mode === "percent" ? 0.1 : 0.01 }}
                                      sx={{ width: 64, "& .MuiInputBase-input": { fontSize: "0.75rem", textAlign: "center" }, "& .MuiInputBase-root": { height: 32 } }}
                                    />
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      onClick={() => handleApplyExtraAmount(question, pkg.id, optionKey)}
                                      disabled={!hasEditableRule}
                                      sx={{ minWidth: 56, height: 32, fontSize: "0.75rem" }}
                                    >
                                      Apply
                                    </Button>
                                  </Box>
                                </TableCell>
                              )
                            })}
                          </TableRow> */}
                        </React.Fragment>
                      )
                    })
                  : null}
            </TableBody>
          </Table>
        </TableContainer>
        <Box display="flex" justifyContent="flex-end" mt={1}>
          {/* {question.question_type == 'conditional'&& */}
            <Button
              variant="contained"
              color="primary"
              disabled={!changedQuestions[question.id] || isLoading}
              onClick={() => handleSave(question.id)}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          {/* } */}
        </Box>
        {/* Render sub_questions if they exist and it's not a multiple_yes_no (as its sub_questions are handled in the table) */}
        {question.sub_questions &&
          question.sub_questions.length > 0 &&
          question.question_type !== "multiple_yes_no" && (
            <Box mt={2}>
              <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                Sub-questions:
              </Typography>
              {question.sub_questions.map((subQ) => renderQuestionTable(subQ, level + 1))}
            </Box>
          )}
        {/* Render child_questions if they exist and it's not a conditional (as its child_questions are handled within the conditional block) */}
        {question.child_questions &&
          question.child_questions.length > 0 &&
          question.question_type !== "conditional" && (
            <Box mt={2}>
              <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                Conditional Questions:
              </Typography>
              {question.child_questions.map((childQ) => renderQuestionTable(childQ, level + 1))}
            </Box>
          )}
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Price Setup
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {`Set values per option and package. Use the ${currencySymbol}/% selector to the left of each price input (default ${currencySymbol}). For ${currencySymbol}, the value is a fixed amount; for %, it is a percentage of total (upcharge or discount). Under "Add to price": choose ${currencySymbol} or %, enter the amount, then Apply. Save to update the backend.`}
      </Typography>
      {topLevelQuestions.map((question) => renderQuestionTable(question))}
      <Popover
        open={Boolean(popoverAnchor.element)}
        anchorEl={popoverAnchor.element}
        onClose={handlePopoverClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Box p={2}>
          <Typography variant="subtitle2" gutterBottom>
            Select Price Type
          </Typography>
          <RadioGroup
            value={
              getPriceRule(
                popoverAnchor.questionId,
                popoverAnchor.packageId,
                popoverAnchor.answer,
                popoverAnchor.optionId,
              )?.priceType || "ignore"
            }
            onChange={(e) => handlePriceTypeSelect(e.target.value)}
          >
            {["upcharge", "discount", "ignore", "bid_in_person"].map((type) => (
              <FormControlLabel
                key={type}
                value={type}
                control={<Radio size="small" />}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2">{type.replace(/_/g, " ")}</Typography>
                    <Tooltip title={`Type: ${type}`}>
                      <Info fontSize="small" />
                    </Tooltip>
                  </Box>
                }
              />
            ))}
          </RadioGroup>
        </Box>
      </Popover>
    </Box>
  )
}

export default PriceSetupForm
