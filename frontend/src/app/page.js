"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function Home() {
  const [mode, setMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("bookingToken") || "";
  });
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const authHeader = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const loadProfileAndBookings = async (jwt) => {
    const [mePayload, bookingsPayload] = await Promise.all([
      apiRequest("/auth/me", { headers: { Authorization: `Bearer ${jwt}` } }),
      apiRequest("/bookings/mine", { headers: { Authorization: `Bearer ${jwt}` } }),
    ]);
    setUser(mePayload.user);
    setBookings(bookingsPayload.bookings || []);
  };

  const loadSlots = async (serviceId, date) => {
    if (!serviceId || !date) return;
    const payload = await apiRequest(
      `/bookings/slots?serviceId=${serviceId}&date=${date}`
    );
    setSlots(payload.slots || []);
    setSelectedSlot("");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      apiRequest("/services")
        .then(async (servicesPayload) => {
          setServices(servicesPayload.services || []);
          if (servicesPayload.services?.length) {
            const defaultService = String(servicesPayload.services[0].id);
            setSelectedService(defaultService);
            await loadSlots(defaultService, todayISO());
          }
        })
        .catch(() => setMessage("Failed to load services"));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!token) return undefined;

    const timer = setTimeout(() => {
      loadProfileAndBookings(token).catch(() => {
        window.localStorage.removeItem("bookingToken");
        setToken("");
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [token]);

  const onServiceChange = async (serviceId) => {
    setSelectedService(serviceId);
    try {
      await loadSlots(serviceId, selectedDate);
    } catch (_error) {
      setMessage("Failed to load available slots");
    }
  };

  const onDateChange = async (date) => {
    setSelectedDate(date);
    try {
      await loadSlots(selectedService, date);
    } catch (_error) {
      setMessage("Failed to load available slots");
    }
  };

  const onAuthSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const path = mode === "register" ? "/auth/register" : "/auth/login";
      const body =
        mode === "register"
          ? authForm
          : { email: authForm.email, password: authForm.password };

      const payload = await apiRequest(path, {
        method: "POST",
        body: JSON.stringify(body),
      });

      window.localStorage.setItem("bookingToken", payload.token);
      setToken(payload.token);
      setUser(payload.user);
      setAuthForm({ name: "", email: "", password: "" });
      const bookingsPayload = await apiRequest("/bookings/mine", {
        headers: { Authorization: `Bearer ${payload.token}` },
      });
      setBookings(bookingsPayload.bookings || []);
      setMessage("Signed in successfully");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const onCreateBooking = async (event) => {
    
    event.preventDefault();
    if (!selectedService || !selectedSlot) {
      setMessage("Please select a service and slot");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await apiRequest("/bookings", {
        method: "POST",
        headers: authHeader,
        body: JSON.stringify({
          serviceId: Number(selectedService),
          startTime: selectedSlot,
          notes,
        }),
      });

      setNotes("");
      await loadSlots(selectedService, selectedDate);
      const bookingsPayload = await apiRequest("/bookings/mine", {
        headers: authHeader,
      });
      setBookings(bookingsPayload.bookings || []);
      setMessage("Booking created");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const onCancelBooking = async (bookingId) => {
    setLoading(true);
    setMessage("");
    try {
      await apiRequest(`/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        headers: authHeader,
      });
      const bookingsPayload = await apiRequest("/bookings/mine", {
        headers: authHeader,
      });
      setBookings(bookingsPayload.bookings || []);
      await loadSlots(selectedService, selectedDate);
      setMessage("Booking cancelled");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const onLogout = () => {
    window.localStorage.removeItem("bookingToken");
    setToken("");
    setUser(null);
    setBookings([]);
    setMessage("Logged out");
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold">Koalendar Booking</h1>
      <p className="text-sm text-zinc-600">Book services by selecting date and available slot.</p>
      {message ? <p className="rounded bg-zinc-100 p-3 text-sm">{message}</p> : null}

      {!user ? (
        <section className="rounded-xl border border-zinc-200 p-4">
          <div className="mb-4 flex gap-2">
            <button
              className={`rounded px-3 py-1 ${mode === "login" ? "bg-black text-white" : "bg-zinc-200"}`}
              onClick={() => setMode("login")}
              type="button"
            >
              Login
            </button>
            <button
              className={`rounded px-3 py-1 ${mode === "register" ? "bg-black text-white" : "bg-zinc-200"}`}
              onClick={() => setMode("register")}
              type="button"
            >
              Register
            </button>
          </div>

          <form className="grid gap-3 md:max-w-md" onSubmit={onAuthSubmit}>
            {mode === "register" ? (
              <input
                className="rounded border p-2"
                placeholder="Full name"
                value={authForm.name}
                onChange={(e) => setAuthForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            ) : null}
            <input
              className="rounded border p-2"
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
            <input
              className="rounded border p-2"
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
            <button className="rounded bg-black px-4 py-2 text-white" disabled={loading} type="submit">
              {loading ? "Please wait..." : mode === "register" ? "Create account" : "Sign in"}
            </button>
          </form>
        </section>
      ) : (
        <>
          <section className="flex items-center justify-between rounded-xl border border-zinc-200 p-4">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-zinc-600">{user.email}</p>
            </div>
            <button className="rounded bg-zinc-900 px-3 py-2 text-white" onClick={onLogout} type="button">
              Logout
            </button>
          </section>

          <section className="rounded-xl border border-zinc-200 p-4">
            <h2 className="mb-3 text-xl font-semibold">Create Booking</h2>
            <form className="grid gap-3 md:grid-cols-2" onSubmit={onCreateBooking}>
              <select
                className="rounded border p-2"
                value={selectedService}
                onChange={(e) => onServiceChange(e.target.value)}
                required
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({service.durationMinutes} min)
                  </option>
                ))}
              </select>

              <input
                className="rounded border p-2"
                type="date"
                value={selectedDate}
                min={todayISO()}
                onChange={(e) => onDateChange(e.target.value)}
                required
              />

              <select
                className="rounded border p-2 md:col-span-2"
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                required
              >
                <option value="">Select available slot</option>
                {slots.map((slot) => (
                  <option key={slot} value={slot}>
                    {new Date(slot).toLocaleString()}
                  </option>
                ))}
              </select>

              <textarea
                className="rounded border p-2 md:col-span-2"
                placeholder="Optional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
              <button className="rounded bg-black px-4 py-2 text-white md:col-span-2" disabled={loading} type="submit">
                {loading ? "Saving..." : "Book now"}
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-zinc-200 p-4">
            <h2 className="mb-3 text-xl font-semibold">My Bookings</h2>
            {bookings.length === 0 ? <p>No bookings yet.</p> : null}
            <div className="grid gap-3">
              {bookings.map((booking) => (
                <article className="rounded border border-zinc-200 p-3" key={booking.id}>
                  <p className="font-medium">{booking.Service?.name}</p>
                  <p className="text-sm">{new Date(booking.startTime).toLocaleString()}</p>
                  <p className="text-sm capitalize">Status: {booking.status}</p>
                  {booking.status === "confirmed" ? (
                    <button
                      className="mt-2 rounded bg-red-600 px-3 py-1 text-sm text-white"
                      onClick={() => onCancelBooking(booking.id)}
                      type="button"
                    >
                      Cancel booking
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
