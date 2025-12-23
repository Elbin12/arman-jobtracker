import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Card,
  CardContent,
  CardHeader,
  Badge,
  OutlinedInput,
  IconButton,
  Button,
} from "@mui/material";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Users, RotateCcw, Plus, XSquare } from "lucide-react";
import moment from "moment-timezone";
import { jobsApi, useUpdateJobMutation } from "../../../store/api/jobsApi";
import { useGetEmployeesQuery } from "../../../store/api/payrollApi";
import { useGetServicesQuery } from "../../../store/api/servicesApi";
import { useDispatch } from "react-redux";

export function EditJobDialog({ job, open, onClose, objective, handleJobUpdate, accountTimezone = "America/Chicago" }) {
  const [updateJob, { isLoading, error }] = useUpdateJobMutation();
  const [customServices, setCustomServices] = useState([]);
  const [showCustomServiceForm, setShowCustomServiceForm] = useState(false);
  const [customServiceData, setCustomServiceData] = useState({
    name: "",
    duration: "",
    price: ""
  });
  const [jobServices, setJobServices] = useState([]);
  const customServiceSectionRef = useRef(null);

  const { data: employeesData, isLoading: employeesLoading } = useGetEmployeesQuery({ pay_scale_type: 'project', is_active: true });
  const { data: servicesData, isLoading: servicesLoading } = useGetServicesQuery(1);

  const employees = employeesData?.results || [];
  
  // Get services from API
  const apiServices = servicesData?.results || [];

  const dispatch = useDispatch();
  const { toast } = useToast();

  // Store form data in the same structure as the job object
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    job_type: "one_time",
    priority: "medium",
    duration_hours: 2,
    scheduled_at: "",
    customer_name: "",
    customer_address: "",
    customer_phone: "",
    customer_email: "",
    notes: "",
    status: "pending",
    total_price: 0,
    quoted_by: null,
    ghl_contact_id: "",
    repeat_every: null,
    repeat_unit: null,
    occurrences: null,
    items: [],
    assignments: [],
  });

  const [timeData, setTimeData] = useState({
    date: "",
    hour: "12",
    minute: "00",
    period: "PM"
  });

  // Initialize form data directly from job
  useEffect(() => {
    if (open && job) {
      // Parse scheduled date (parse as UTC to show time directly from API)
      let parsedTimeData = { date: "", hour: "12", minute: "00", period: "PM" };
      if (job.scheduled_at) {
        const m = moment.utc(job.scheduled_at);
        const dateStr = m.format("YYYY-MM-DD");

        let hours = m.hour();
        const minutes = m.format("mm");
        const period = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;

        parsedTimeData = {
          date: dateStr,
          hour: String(hours),
          minute: minutes,
          period: period
        };
      }
      setTimeData(parsedTimeData);

      // Extract custom services from items
      const extractedCustomServices = [];
      const servicesFromJob = [];
      if (job.items && job.items.length > 0) {
        job.items.forEach(item => {
          if (item.custom_name) {
            extractedCustomServices.push({
              id: item.id,
              name: item.custom_name,
              duration: parseFloat(item.duration_hours) || 1,
              price: parseFloat(item.price) || 0
            });
          } else {
            servicesFromJob.push(item);
          }
        });
      }
      setCustomServices(extractedCustomServices);
      setJobServices(servicesFromJob);

      // Set form data directly from job structure
      setFormData({
        title: job.title || "",
        description: job.description || "",
        job_type: job.job_type || "one_time",
        priority: job.priority || "medium",
        duration_hours: job.duration_hours || 2,
        scheduled_at: job.scheduled_at || "",
        customer_name: job.customer_name || "",
        customer_address: job.customer_address || "",
        customer_phone: job.customer_phone || "",
        customer_email: job.customer_email || "",
        notes: job.notes || "",
        status: objective === 'convert'? "pending": job.status || "pending",
        total_price: job.total_price || 0,
        quoted_by: job.quoted_by || null,
        ghl_contact_id: job.ghl_contact_id || "",
        repeat_every: job.repeat_every || null,
        repeat_unit: job.repeat_unit || null,
        occurrences: job.occurrences || null,
        items: job.items || [],
        assignments: job.assignments || [],
        day_of_week: job.day_of_week
      });
    }
  }, [open, job]);

  // Helper to get selected service IDs
  const getSelectedServiceIds = () => {
    return formData.items.map(item => item.service || item.id);
  };

  // Helper to check if a service is selected
  const isServiceSelected = (serviceId) => {
    return getSelectedServiceIds().includes(serviceId);
  };

  // Helper to get service price from items
  const getServicePrice = (serviceId) => {
    const item = formData.items.find(i => i.service === serviceId || i.id === serviceId);
    return item ? parseFloat(item.price) || 0 : 0;
  };

  // Update scheduled_at when time data changes
  const updateScheduledAt = (updated) => {
    if (updated.date && updated.hour && updated.minute && updated.period) {
      let hour24 = parseInt(updated.hour);
      if (updated.period === "PM" && hour24 !== 12) hour24 += 12;
      if (updated.period === "AM" && hour24 === 12) hour24 = 0;

      // Create moment in account timezone, then convert to UTC
      const timeStr = `${String(hour24).padStart(2, '0')}:${updated.minute}:00`;
      const localMoment = moment.tz(`${updated.date} ${timeStr}`, "YYYY-MM-DD HH:mm:ss", accountTimezone);
      const utcIsoString = localMoment.utc().toISOString();
      
      setFormData(prev => ({ ...prev, scheduled_at: utcIsoString }));
    }
  };

  // Recalculate total price whenever items change
  useEffect(() => {
    const total = formData.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    setFormData(prev => ({
      ...prev,
      total_price: total
    }));
  }, [formData.items]);

  const handleServiceChange = (service, checked) => {
    const serviceId = service.service || service.id;
    if (checked) {
      // Add service to items
      const apiService = apiServices.find(s => s.id === serviceId);
      const jobService = jobServices.find(s => s.service === serviceId);
      const customService = customServices.find(s => s.id === serviceId);

      if (apiService) {
        setFormData(prev => ({
          ...prev,
          items: [...prev.items, {
            service: apiService.id,
            price: parseFloat(apiService.price) || 0,
            duration_hours: parseFloat(apiService.hours) || 1
          }]
        }));
      } else if (jobService) {
        setFormData(prev => ({
          ...prev,
          items: [...prev.items, jobService]
        }));
      } else if (customService) {
        setFormData(prev => ({
          ...prev,
          items: [...prev.items, {
            id: customService.id,
            custom_name: customService.name,
            price: customService.price,
            duration_hours: customService.duration
          }]
        }));
      }
    } else {
      // Remove service from items
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item =>
          (item.service !== serviceId) && (item.id !== serviceId)
        )
      }));
    }
  };

  const handleServicePriceChange = (serviceId, price) => {
    const numPrice = parseFloat(price) || 0;
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.service === serviceId || item.id === serviceId) {
          return { ...item, price: numPrice };
        }
        return item;
      })
    }));
  };

  const addCustomService = () => {
    if (!customServiceData.name.trim()) {
      return;
    }

    const customService = {
      id: `custom-${Date.now()}-${Math.random()}`,
      name: customServiceData.name.trim(),
      duration: parseInt(customServiceData.duration) || 1,
      price: parseFloat(customServiceData.price) || 0
    };

    setCustomServices(prev => [...prev, customService]);

    // Add to items
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: customService.id,
        custom_name: customService.name,
        price: customService.price,
        duration_hours: customService.duration
      }]
    }));

    setCustomServiceData({ name: "", duration: "", price: "" });
    setShowCustomServiceForm(false);
  };

  const removeCustomService = (serviceId) => {
    setCustomServices(prev => prev.filter(s => s.id !== serviceId));
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== serviceId)
    }));
  };

  const handleUserAssignment = (userId, checked) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        assignments: [...prev.assignments, { user: userId }]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        assignments: prev.assignments.filter(a => a.user !== userId)
      }));
    }
  };

  const isUserAssigned = (userId) => {
    return formData.assignments.some(a => a.user === userId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      return;
    }

    if (formData.items.length === 0) {
      return;
    }

    try {
      // Clean up items - ensure proper structure
      const cleanedItems = formData.items.map(item => {
        if (item.service) {
          // Database service
          return {
            service: item.service,
            price: parseFloat(item.price) || 0,
            duration_hours: parseFloat(item.duration_hours) || 1
          };
        } else {
          // Custom service
          return {
            custom_name: item.custom_name,
            price: parseFloat(item.price) || 0,
            duration_hours: parseFloat(item.duration_hours) || 1
          };
        }
      });

      const payload = {
        ...formData,
        items: cleanedItems,
        duration_hours: parseFloat(formData.duration_hours),
        total_price: parseFloat(formData.total_price),
      };

      const result = await updateJob({ id: job.id, filter:objective==='convert'&&'status=to_convert', ...payload}).unwrap();

      console.log("RTK update using address:", job.customer_address);

      // Show success message
      if (objective === 'convert') {
        toast({
          title: "Success",
          description: "Quote converted to job successfully!",
        });
      } else {
        toast({
          title: "Success",
          description: "Job updated successfully!",
        });
      }

      if (handleJobUpdate) {
        handleJobUpdate(result);
      }

      onClose();
    } catch (err) {
      console.error("Failed to update job:", err);
      toast({
        title: "Error",
        description: err?.data?.message || (objective === 'convert' ? "Failed to convert quote to job. Please try again." : "Failed to update job. Please try again."),
        variant: "destructive",
      });
    }
  };

  const isRecurring = formData.job_type === "recurring";

  // Helper to convert priority string to number for select
  const priorityToNumber = (priority) => {
    switch (priority) {
      case "low": return 1;
      case "medium": return 2;
      case "high": return 3;
      default: return 2;
    }
  };

  // Helper to convert number to priority string
  const numberToPriority = (num) => {
    switch (parseInt(num)) {
      case 1: return "low";
      case 2: return "medium";
      case 3: return "high";
      default: return "medium";
    }
  };

  console.log(formData);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          zIndex: 1400, // Higher than navbar (1200) and parent dialog (1300)
        }
      }}
      BackdropProps={{
        sx: {
          zIndex: 1399, // Just below the dialog content
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }
      }}
      disableEnforceFocus={true}
      disableAutoFocus={false}
      disableRestoreFocus={false}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pr: 2, // space for button
        }}
      >
        { objective === 'convert' ? "Convert to job": "Edit Job"}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <XSquare color="#8FABD4" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <div className="space-y-3">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Job Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Window cleaning for office building"
                required
              />
            </div>

            {/* Services */}
            <div className="space-y-2">
              <Label htmlFor="services">Services *</Label>
              <Card className="border">
                <CardContent className="pt-4 px-4">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3 pr-4">
                      {/* Loading Skeleton */}
                      {servicesLoading && (
                        <>
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="border rounded-lg p-3">
                              <div className="flex items-start space-x-3">
                                <Skeleton className="h-4 w-4 rounded mt-1" />
                                <div className="flex-1 min-w-0 space-y-2">
                                  <Skeleton className="h-4 w-3/4" />
                                  <Skeleton className="h-3 w-1/2" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                      
                      {/* Database Services from API */}
                      {!servicesLoading && apiServices.map(service => (
                        <div key={service.id} className="border rounded-lg p-3">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              id={`service-${service.id}`}
                              checked={isServiceSelected(service.id)}
                              onCheckedChange={(checked) => handleServiceChange(service, checked)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <Label
                                htmlFor={`service-${service.id}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {service.name}
                              </Label>
                              <div className="text-xs text-muted-foreground mt-1">
                                {service.hours && `${service.hours}h`}
                                {service.hours && service.price && " • "}
                                {service.price && `$${service.price}`}
                              </div>
                              {isServiceSelected(service.id) && (
                                <div className="mt-2">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={getServicePrice(service.id) || ''}
                                    onChange={(e) => handleServicePriceChange(service.id, e.target.value)}
                                    placeholder="Price"
                                    className="h-8 text-sm"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                    {/* Custom Services */}
                    {!servicesLoading && customServices.length > 0 && (
                      <div className="border-t pt-3 mt-3">
                        <h4 className="text-sm font-medium mb-3">Custom Services</h4>
                        {customServices.map(service => (
                          <div key={service.id} className="border rounded-lg p-3 mb-3">
                            <div className="flex items-start space-x-3">
                              <Checkbox
                                id={`custom-service-${service.id}`}
                                checked={isServiceSelected(service.id)}
                                onCheckedChange={(checked) => handleServiceChange(service.id, checked)}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <Label
                                    htmlFor={`custom-service-${service.id}`}
                                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                                  >
                                    {service.name}
                                    <Badge variant="secondary" className="text-xs">Custom</Badge>
                                  </Label>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeCustomService(service.id)}
                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive/90"
                                  >
                                    ×
                                  </Button>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {service.duration}h • ${service.price}
                                </div>
                                {isServiceSelected(service.id) && (
                                  <div className="mt-2">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={getServicePrice(service.id) || ''}
                                      onChange={(e) => handleServicePriceChange(service.id, e.target.value)}
                                      placeholder="Price"
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>

                  {/* Add Custom Service Section */}
                  <div ref={customServiceSectionRef} className="mt-4 pt-4 border-t">
                    {!showCustomServiceForm ? (
                      <Button
                        variant="outlined"
                        size="sm"
                        onClick={() => setShowCustomServiceForm(true)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Custom Service
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">New Custom Service</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowCustomServiceForm(false);
                              setCustomServiceData({ name: "", duration: "", price: "" });
                            }}
                            className="h-8 w-8 p-0"
                          >
                            ×
                          </Button>
                        </div>
                        <Input
                          placeholder="Service name"
                          value={customServiceData.name}
                          onChange={(e) => setCustomServiceData(prev => ({ ...prev, name: e.target.value }))}
                          autoFocus
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder="Hours"
                            value={customServiceData.duration}
                            onChange={(e) => setCustomServiceData(prev => ({ ...prev, duration: e.target.value }))}
                            step="0.5"
                            min="0"
                          />
                          <Input
                            type="number"
                            placeholder="Price"
                            value={customServiceData.price}
                            onChange={(e) => setCustomServiceData(prev => ({ ...prev, price: e.target.value }))}
                            step="0.01"
                            min="0"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={addCustomService}
                          size="sm"
                          className="w-full"
                        >
                          Add Service
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of the job..."
              rows={3}
            />
          </div>

          {/* Job Details Row */}
          <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Priority and Status */}
            <div className="flex gap-1">
              <FormControl fullWidth size="small">
                <InputLabel id="priority-label">Priority</InputLabel>
                <Select
                  labelId="priority-label"
                  id="priority"
                  value={priorityToNumber(formData.priority).toString()}
                  label="Priority"
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: numberToPriority(e.target.value) }))}
                >
                  <MenuItem value="1">Low</MenuItem>
                  <MenuItem value="2">Medium</MenuItem>
                  <MenuItem value="3">High</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" disabled={objective === 'convert'}>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="service_due">Service Due</MenuItem>
                  <MenuItem value="on_the_way">On The Way</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </div>

            {/* Duration and Price */}
            <div className="flex gap-1">
              <TextField
                id="estimated_duration"
                label="Duration (hours)"
                type="number"
                size="small"
                fullWidth
                inputProps={{ min: 0.5, step: 0.5 }}
                value={formData.duration_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: parseFloat(e.target.value) || 0 }))}
                placeholder="2"
              />

              <TextField
                id="price"
                label="Price ($)"
                type="number"
                size="small"
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.total_price}
                onChange={(e) => setFormData(prev => ({ ...prev, total_price: parseFloat(e.target.value) || 0 }))}
                placeholder="100.00"
              />
            </div>

            {/* Date and Time */}
            <div className="flex justify-between gap-2">
              <TextField
                fullWidth
                id="scheduled_date"
                label="Date"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={timeData.date || ""}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setTimeData(prevTime => {
                    const updated = { ...prevTime, date: newDate };
                    updateScheduledAt(updated);
                    return updated;
                  });
                }}
              />
              <FormControl fullWidth size="small">
                <InputLabel id="hour-label">Hour</InputLabel>
                <Select
                  labelId="hour-label"
                  value={timeData.hour || ""}
                  label="Hour"
                  onChange={(e) => {
                    const value = e.target.value;
                    setTimeData(prevTime => {
                      const updated = { ...prevTime, hour: value };
                      updateScheduledAt(updated);
                      return updated;
                    });
                  }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <MenuItem key={h} value={String(h)}>
                      {h}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <div className="flex justify-between gap-2">
              <FormControl fullWidth size="small">
                <InputLabel id="minute-label">Minute</InputLabel>
                <Select
                  labelId="minute-label"
                  value={timeData.minute || ""}
                  label="Minute"
                  onChange={(e) => {
                    const value = e.target.value;
                    setTimeData(prevTime => {
                      const updated = { ...prevTime, minute: value };
                      updateScheduledAt(updated);
                      return updated;
                    });
                  }}
                >
                  {["00", "15", "30", "45"].map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel id="period-label">Period</InputLabel>
                <Select
                  labelId="period-label"
                  value={timeData.period || ""}
                  label="Period"
                  onChange={(e) => {
                    const value = e.target.value;
                    setTimeData(prevTime => {
                      const updated = { ...prevTime, period: value };
                      updateScheduledAt(updated);
                      return updated;
                    });
                  }}
                >
                  <MenuItem value="AM">AM</MenuItem>
                  <MenuItem value="PM">PM</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>

          {/* Customer Information */}
          <Card>
            <CardHeader
              avatar={<Users className="h-5 w-5" />}
              title="Customer Information"
            />
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Customer Name</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ghl_contact_id">GHL Contact ID</Label>
                  <Input
                    id="ghl_contact_id"
                    value={formData.ghl_contact_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, ghl_contact_id: e.target.value }))}
                    placeholder="GoHighLevel contact ID"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer_phone">Phone</Label>
                  <Input
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_email">Email</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_address">Address</Label>
                <Textarea
                  id="customer_address"
                  value={formData.customer_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
                  placeholder="123 Main St, City, State 12345"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Team Assignment */}
          <Card>
            <CardHeader
              avatar={<Users className="h-5 w-5" />}
              title="Team Assignment"
            />
            <CardContent className="space-y-4">
              <FormControl fullWidth>
                <InputLabel id="quoted-by-label">Quoted By</InputLabel>
                <Select
                  labelId="quoted-by-label"
                  id="quoted_by"
                  value={formData.quoted_by || ""}
                  label="Quoted By"
                  displayEmpty
                  onChange={(e) => setFormData(prev => ({ ...prev, quoted_by: e.target.value || null }))}
                >
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.user_id || employee.id}>
                      {employee.full_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <div className="space-y-2">
                <Label>Assign Team Members</Label>
                {employeesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-muted-foreground">Loading employees...</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {employees.map(employee => (
                      <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`employee-${employee.id}`}
                          checked={isUserAssigned(employee.user_id || employee.id)}
                          onCheckedChange={(checked) => handleUserAssignment(employee.user_id || employee.id, checked)}
                        />
                        <Label htmlFor={`employee-${employee.id}`} className="flex-1 cursor-pointer">
                          {employee.full_name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Job Settings */}
        { objective === 'convert' && 
          <Card>
            <CardHeader
              avatar={<RotateCcw className="h-5 w-5" />}
              title="Job Settings"
            />
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="one_time"
                  checked={formData.job_type==='one_time'}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, job_type: checked ? "one_time" : "recurring" }))}
                />
                <Label htmlFor="one_time" className="cursor-pointer">This is a first time job</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    job_type: checked ? "recurring" : "one_time",
                    repeat_every: checked ? (prev.repeat_every || 1) : null,
                    repeat_unit: checked ? (prev.repeat_unit || "day") : null,
                    occurrences: checked ? (prev.occurrences || 1) : null,
                    day_of_week: checked ? (prev.day_of_week) : null
                  }))}
                />
                <Label htmlFor="is_recurring" className="cursor-pointer">This is a recurring job</Label>
              </div>

              {isRecurring && (
                <div className="space-y-4 pl-4 sm:pl-6 border-l-2 border-muted">
                  <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <Label htmlFor="interval">Repeat Every</Label>
                      <Input
                        id="interval"
                        type="number"
                        min="1"
                        max="52"
                        value={formData.repeat_every || 1}
                        onChange={(e) => setFormData(prev => ({ ...prev, repeat_every: parseInt(e.target.value) || 1 }))}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label id="frequency-label">Unit</Label>
                      <FormControl fullWidth size="small" variant="">
                        {/* <InputLabel id="frequency-label">Unit</InputLabel> */}
                        <Select
                          labelId="frequency-label"
                          id="frequency"
                          value={formData.repeat_unit || "day"}
                          label="Unit"
                          onChange={(e) => setFormData(prev => ({ ...prev, repeat_unit: e.target.value }))}
                          inputProps={{ 'aria-label': 'Without label' }}
                          input={<OutlinedInput notched={false} />}
                        >
                          <MenuItem value="day">Day(s)</MenuItem>
                          <MenuItem value="week">Week(s)</MenuItem>
                          <MenuItem value="month">Month(s)</MenuItem>
                          <MenuItem value="quarter">Quarter(s)</MenuItem>
                          <MenuItem value="semi_annual">Semi Annual(s)</MenuItem>
                          <MenuItem value="year">Year(s)</MenuItem>
                        </Select>
                      </FormControl>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="recurrence_count">Occurrences</Label>
                      <Input
                        id="recurrence_count"
                        type="number"
                        min="1"
                        max="365"
                        value={formData.occurrences || 1}
                        onChange={(e) => setFormData(prev => ({ ...prev, occurrences: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                  </div>

                  {formData.repeat_unit === 'week' && (
                    <div className="space-y-1">
                      <FormControl fullWidth>
                        <InputLabel id="day-of-week-label">Day of Week</InputLabel>
                        <Select
                          labelId="day-of-week-label"
                          id="day_of_week"
                          value={formData.day_of_week || ""}
                          label="Day of Week"
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              day_of_week: e.target.value,
                            }))
                          }
                        >
                          <MenuItem value="0">Sunday</MenuItem>
                          <MenuItem value="1">Monday</MenuItem>
                          <MenuItem value="2">Tuesday</MenuItem>
                          <MenuItem value="3">Wednesday</MenuItem>
                          <MenuItem value="4">Thursday</MenuItem>
                          <MenuItem value="5">Friday</MenuItem>
                          <MenuItem value="6">Saturday</MenuItem>
                        </Select>
                      </FormControl>
                    </div>
                  )}

                  {formData.scheduled_at && (
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                      {formData.repeat_every > 1 && formData.repeat_unit === 'week' && (
                        <p>Bi-weekly: Every {formData.repeat_every} weeks</p>
                      )}
                      {formData.repeat_every === 1 && formData.repeat_unit === 'week' && (
                        <p>Weekly</p>
                      )}
                      {formData.repeat_unit === 'day' && (
                        <p>Daily: Every {formData.repeat_every} day{formData.repeat_every > 1 ? 's' : ''}</p>
                      )}
                      {formData.repeat_unit === 'month' && (
                        <p>Monthly: Every {formData.repeat_every} month{formData.repeat_every > 1 ? 's' : ''}</p>
                      )}
                      {formData.repeat_unit === 'quarter' && (
                        <p>Quarterly: Every {formData.repeat_every} quarter{formData.repeat_every > 1 ? 's' : ''}</p>
                      )}
                      {formData.repeat_unit === 'semi_annual' && (
                        <p>Semi-annually: Every {formData.repeat_every * 6} months</p>
                      )}
                      {formData.repeat_unit === 'year' && (
                        <p>Yearly: Every {formData.repeat_every} year{formData.repeat_every > 1 ? 's' : ''}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        }

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes or special instructions..."
              rows={3}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error.data?.message || "Failed to update job. Please try again."}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sticky bottom-0">
            <Button variant="contained" onClick={handleSubmit} disabled={isLoading} className="sm:flex-1 w-full">
              {isLoading ? "Updating..." : objective === "convert"? "Convert to Job" : "Update Job"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}