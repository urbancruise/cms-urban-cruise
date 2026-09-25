"use client";

import { MdOutlineAdd, MdOutlineRemove } from "react-icons/md";
import RichEditor from "./RichEditor";
import ImageUpload from "./ImageUpload";
import ImageList from "./ImageList";

// ============================================================
// Shared input style
// ============================================================
export const inputCls =
  "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500";

// ============================================================
// Local item shapes — used to strongly type RichList<T>
// ============================================================
interface ImageItemShape {
  url: string;
  publicId: string;
}

interface GroupSizeVehicle {
  name: string;
  tagline: string;
  seats: string;
  price: string;
  description: string;
  images: ImageItemShape[];
}

interface OccasionCard {
  image: string;
  imagePublicId: string;
  title: string;
  seats: string;
  price: string;
  location: string;
  description: string;
  features: string[];
  bookLabel: string;
  bookLink: string;
  readMoreLabel: string;
  readMoreLink: string;
}

interface OccasionTab {
  label: string;
  slug: string;
  cards: OccasionCard[];
}

interface CompareFeature {
  icon: string;
  label: string;
  value: string;
}

interface CompareCard {
  badge: string;
  badgeIcon: string;
  image: string;
  imagePublicId: string;
  name: string;
  price: string;
  accentColor: string;
  features: CompareFeature[];
  footerText: string;
  bookLabel: string;
  bookLink: string;
}

interface ComparePair {
  cardA: CompareCard;
  cardB: CompareCard;
}

interface WhyChooseBenefit {
  number: string;
  title: string;
  color: string;
  items: string[];
  image: string;
  imagePublicId: string;
}

interface DiscoverPlace {
  tabLabel: string;
  tabSlug: string;
  placeName: string;
  tagline: string;
  description: string;
  images: ImageItemShape[];
  duration: string;
  bestTime: string;
  bestFor: string;
  highlights: string[];
}

// ============================================================
// FormEditor — shared across Home & Vehicles pages
// ============================================================
export function FormEditor({
  sectionKey,
  value,
  onChange,
}: {
  sectionKey: string;
  value: any;
  onChange: (v: any) => void;
}) {
  const set = (key: string, val: any) => onChange({ ...value, [key]: val });

  // ============================================================
  // HERO
  // ============================================================
  if (sectionKey === "hero") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="Urban Cruise bus & car rental"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Title">
            <input
              type="text"
              value={value.title || ""}
              onChange={(e) => set("title", e.target.value)}
              className={inputCls}
              placeholder="No. 1 Vehicle Rental Service"
            />
          </Field>

          <Field label="Title Highlight">
            <input
              type="text"
              value={value.titleHighlight || ""}
              onChange={(e) => set("titleHighlight", e.target.value)}
              className={inputCls}
              placeholder="Provider Company in Delhi"
            />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            rows={3}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="Short intro shown under the hero title"
          />
        </Field>

        <Field label="Background Image">
          <ImageUpload
            value={value.backgroundImage || null}
            publicId={value.backgroundImagePublicId || null}
            onChange={(url, publicId) =>
              onChange({
                ...value,
                backgroundImage: url || "",
                backgroundImagePublicId: publicId || "",
              })
            }
            scope="hero"
            aspect="21 / 9"
            hint="Wide banner · JPG, PNG, WEBP · Max 300 KB"
          />
        </Field>

        <Field label="Vehicles Image">
          <ImageUpload
            value={value.vehiclesImage || null}
            publicId={value.vehiclesImagePublicId || null}
            onChange={(url, publicId) =>
              onChange({
                ...value,
                vehiclesImage: url || "",
                vehiclesImagePublicId: publicId || "",
              })
            }
            scope="hero"
            aspect="16 / 9"
            hint="Transparent PNG recommended · Max 300 KB"
          />
        </Field>
      </div>
    );
  }

  // ============================================================
  // GET A QUICK CALL
  // ============================================================
  if (sectionKey === "quickcall") {
    return (
      <div className="space-y-5">
        <Field label="Icon Style">
          <select
            value={value.icon || "phone"}
            onChange={(e) => set("icon", e.target.value)}
            className={inputCls}
          >
            <option value="phone">📞 Phone</option>
            <option value="headset">🎧 Headset</option>
            <option value="message">💬 Message</option>
            <option value="calendar">📅 Calendar</option>
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            Round icon shown at the top of the card
          </p>
        </Field>

        <Field label="Title">
          <input
            type="text"
            value={value.title || ""}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="Get a Quick Call"
          />
        </Field>

        <Field label="Subtitle">
          <input
            type="text"
            value={value.subtitle || ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className={inputCls}
            placeholder="Fill in your details and we will call you within 10 mins."
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name Placeholder">
            <input
              type="text"
              value={value.namePlaceholder || ""}
              onChange={(e) => set("namePlaceholder", e.target.value)}
              className={inputCls}
              placeholder="Your Name"
            />
          </Field>

          <Field label="Phone Placeholder">
            <input
              type="text"
              value={value.phonePlaceholder || ""}
              onChange={(e) => set("phonePlaceholder", e.target.value)}
              className={inputCls}
              placeholder="+91 98765 43210"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Submit Button Label">
            <input
              type="text"
              value={value.submitLabel || ""}
              onChange={(e) => set("submitLabel", e.target.value)}
              className={inputCls}
              placeholder="Submit"
            />
          </Field>

          <Field label="Submit Button Icon">
            <select
              value={value.submitIcon || "arrow"}
              onChange={(e) => set("submitIcon", e.target.value)}
              className={inputCls}
            >
              <option value="arrow">→ Arrow</option>
              <option value="phone">📞 Phone</option>
              <option value="check">✓ Check</option>
              <option value="none">None</option>
            </select>
          </Field>
        </div>

        <Field label="Form Action Endpoint">
          <input
            type="text"
            value={value.formAction || ""}
            onChange={(e) => set("formAction", e.target.value)}
            className={inputCls}
            placeholder="/api/quick-call or https://..."
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Where the form submits when the user clicks Submit
          </p>
        </Field>

        <Field label="Success Message">
          <input
            type="text"
            value={value.successMessage || ""}
            onChange={(e) => set("successMessage", e.target.value)}
            className={inputCls}
            placeholder="Thank you! We'll call you shortly."
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Shown after successful form submission
          </p>
        </Field>
      </div>
    );
  }

  // ============================================================
  // ABOUT
  // ============================================================
  if (sectionKey === "about") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="About"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Title">
            <input
              type="text"
              value={value.title || ""}
              onChange={(e) => set("title", e.target.value)}
              className={inputCls}
              placeholder="URBAN CRUISE"
            />
          </Field>
          <Field label="Tagline">
            <input
              type="text"
              value={value.tagline || ""}
              onChange={(e) => set("tagline", e.target.value)}
              className={inputCls}
              placeholder="Your Journey, Our Passion"
            />
          </Field>
        </div>

        <Field label="Video URL (YouTube embed)">
          <input
            type="text"
            value={value.videoUrl || ""}
            onChange={(e) => set("videoUrl", e.target.value)}
            className={inputCls}
            placeholder="https://www.youtube.com/embed/..."
          />
        </Field>

        <RichList<string>
          label="Paragraphs"
          items={value.paragraphs || []}
          onChange={(items) => set("paragraphs", items)}
          emptyItem=""
          renderItem={(item, update) => (
            <RichEditor
              value={normalizeToEditorDoc(item)}
              onChange={(data) => update(editorDocToPlain(data))}
              placeholder="Write a paragraph..."
              minHeight={140}
            />
          )}
        />
      </div>
    );
  }

  // ============================================================
  // HOW IT WORKS
  // ============================================================
  if (sectionKey === "howitworks") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="Simple Process"
          />
        </Field>

        <Field label="Title">
          <input
            type="text"
            value={value.title || ""}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="HOW IT WORKS"
          />
        </Field>

        <Field label="Subtitle">
          <input
            type="text"
            value={value.subtitle || ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className={inputCls}
            placeholder="Simple Steps, Smooth Journey"
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={3}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="Brief intro describing how the process works..."
          />
        </Field>

        <RichList<{
          number: string;
          title: string;
          description: string;
          image: string;
          imagePublicId: string;
        }>
          label="Steps"
          items={value.steps || []}
          onChange={(items) => set("steps", items)}
          emptyItem={{
            number: "",
            title: "",
            description: "",
            image: "",
            imagePublicId: "",
          }}
          renderItem={(item, update) => (
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Number">
                  <input
                    type="text"
                    value={item.number || ""}
                    onChange={(e) =>
                      update({ ...item, number: e.target.value })
                    }
                    className={inputCls}
                    placeholder="01"
                  />
                </Field>
                <Field label="Title">
                  <input
                    type="text"
                    value={item.title || ""}
                    onChange={(e) =>
                      update({ ...item, title: e.target.value })
                    }
                    className={inputCls}
                    placeholder="ENQUIRY"
                  />
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  rows={2}
                  value={item.description || ""}
                  onChange={(e) =>
                    update({ ...item, description: e.target.value })
                  }
                  className={inputCls}
                  placeholder="Share your travel plan with us..."
                />
              </Field>
              <Field label="Step Image">
                <ImageUpload
                  value={item.image || null}
                  publicId={item.imagePublicId || null}
                  onChange={(url, publicId) =>
                    update({
                      ...item,
                      image: url || "",
                      imagePublicId: publicId || "",
                    })
                  }
                  scope="general"
                  aspect="4 / 3"
                  hint="JPG, PNG, WEBP · Max 300 KB"
                />
              </Field>
            </div>
          )}
        />
      </div>
    );
  }

  // ============================================================
  // VEHICLE FOR EVERY BUDGET
  // ============================================================
  if (sectionKey === "vehiclebudget") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="Vehicle Options"
          />
        </Field>
        <Field label="Title">
          <input
            type="text"
            value={value.title || ""}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="A VEHICLE FOR EVERY BUDGET"
          />
        </Field>
        <Field label="Subtitle">
          <input
            type="text"
            value={value.subtitle || ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className={inputCls}
            placeholder="Vehicles For Every Journey, Every Budget"
          />
        </Field>
        <Field label="Description">
          <textarea
            rows={3}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="Short paragraph..."
          />
        </Field>

        <RichList<{
          title: string;
          description: string;
          image: string;
          imagePublicId: string;
        }>
          label="Categories"
          items={value.items || []}
          onChange={(items) => set("items", items)}
          emptyItem={{
            title: "",
            description: "",
            image: "",
            imagePublicId: "",
          }}
          renderItem={(item, update) => (
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <Field label="Title">
                <input
                  type="text"
                  value={item.title || ""}
                  onChange={(e) =>
                    update({ ...item, title: e.target.value })
                  }
                  className={inputCls}
                  placeholder="ECONOMY"
                />
              </Field>
              <Field label="Description">
                <textarea
                  rows={2}
                  value={item.description || ""}
                  onChange={(e) =>
                    update({ ...item, description: e.target.value })
                  }
                  className={inputCls}
                  placeholder="Vehicles with basic amenities..."
                />
              </Field>
              <Field label="Category Image">
                <ImageUpload
                  value={item.image || null}
                  publicId={item.imagePublicId || null}
                  onChange={(url, publicId) =>
                    update({
                      ...item,
                      image: url || "",
                      imagePublicId: publicId || "",
                    })
                  }
                  scope="general"
                  aspect="4 / 3"
                  hint="JPG, PNG, WEBP · Max 300 KB"
                />
              </Field>
            </div>
          )}
        />
      </div>
    );
  }

  // ============================================================
  // VEHICLE FOR EVERY GROUP SIZE
  // ============================================================
  if (sectionKey === "groupsize") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="Fleet Options"
          />
        </Field>
        <Field label="Title">
          <input
            type="text"
            value={value.title || ""}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="VEHICLES FOR EVERY GROUP SIZE"
          />
        </Field>
        <Field label="Subtitle">
          <input
            type="text"
            value={value.subtitle || ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className={inputCls}
            placeholder="The Right Vehicle For Every Group Size"
          />
        </Field>
        <Field label="Description">
          <textarea
            rows={3}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="Intro copy for the section"
          />
        </Field>

        <RichList<GroupSizeVehicle>
          label="Vehicles"
          items={value.vehicles || []}
          onChange={(items) => set("vehicles", items)}
          emptyItem={{
            name: "",
            tagline: "",
            seats: "",
            price: "",
            description: "",
            images: [],
          }}
          renderItem={(item, update) => (
            <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Name">
                  <input
                    type="text"
                    value={item.name || ""}
                    onChange={(e) =>
                      update({ ...item, name: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Maruti Suzuki Dzire"
                  />
                </Field>
                <Field label="Tagline">
                  <input
                    type="text"
                    value={item.tagline || ""}
                    onChange={(e) =>
                      update({ ...item, tagline: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Perfect Sedan for City & Outstation"
                  />
                </Field>
                <Field label="Seats">
                  <input
                    type="text"
                    value={item.seats || ""}
                    onChange={(e) =>
                      update({ ...item, seats: e.target.value })
                    }
                    className={inputCls}
                    placeholder="4 Seater"
                  />
                </Field>
                <Field label="Price (₹/day)">
                  <input
                    type="text"
                    value={item.price || ""}
                    onChange={(e) =>
                      update({ ...item, price: e.target.value })
                    }
                    className={inputCls}
                    placeholder="1999"
                  />
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  rows={3}
                  value={item.description || ""}
                  onChange={(e) =>
                    update({ ...item, description: e.target.value })
                  }
                  className={inputCls}
                  placeholder="Detailed description..."
                />
              </Field>
              <Field label="Vehicle Images">
                <ImageList
                  items={item.images || []}
                  onChange={(images) => update({ ...item, images })}
                  scope="vehicle"
                  aspect="4 / 3"
                  maxImages={8}
                />
              </Field>
            </div>
          )}
        />
      </div>
    );
  }

  // ============================================================
  // VEHICLE FOR EVERY OCCASION
  // ============================================================
  if (sectionKey === "occasion") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="FOR EVERY OCCASION"
          />
        </Field>
        <Field label="Title">
          <input
            type="text"
            value={value.title || ""}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="FOR EVERY OCCASION"
          />
        </Field>
        <Field label="Subtitle">
          <input
            type="text"
            value={value.subtitle || ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className={inputCls}
            placeholder="The Right Vehicle For Every Occasion"
          />
        </Field>
        <Field label="Description">
          <textarea
            rows={4}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="Hire car rental in Delhi for every occasion..."
          />
        </Field>

        <RichList<OccasionTab>
          label="Tabs (Occasions)"
          items={value.tabs || []}
          onChange={(items) => set("tabs", items)}
          emptyItem={{ label: "", slug: "", cards: [] }}
          renderItem={(tab, updateTab) => (
            <div className="space-y-4 p-4 rounded-xl border-2 border-teal-200 bg-teal-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Tab Label">
                  <input
                    type="text"
                    value={tab.label || ""}
                    onChange={(e) =>
                      updateTab({ ...tab, label: e.target.value })
                    }
                    className={inputCls}
                    placeholder="WEDDING TRAVEL"
                  />
                </Field>
                <Field label="Tab Slug">
                  <input
                    type="text"
                    value={tab.slug || ""}
                    onChange={(e) =>
                      updateTab({ ...tab, slug: e.target.value })
                    }
                    className={inputCls}
                    placeholder="wedding-travel"
                  />
                </Field>
              </div>

              <div className="border-t border-teal-200 pt-4">
                <RichList<OccasionCard>
                  label="Cards"
                  items={tab.cards || []}
                  onChange={(cards) => updateTab({ ...tab, cards })}
                  emptyItem={{
                    image: "",
                    imagePublicId: "",
                    title: "",
                    seats: "",
                    price: "",
                    location: "",
                    description: "",
                    features: [],
                    bookLabel: "BOOK NOW",
                    bookLink: "",
                    readMoreLabel: "READ MORE",
                    readMoreLink: "",
                  }}
                  renderItem={(card, updateCard) => (
                    <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-white">
                      <Field label="Card Image">
                        <ImageUpload
                          value={card.image || null}
                          publicId={card.imagePublicId || null}
                          onChange={(url, publicId) =>
                            updateCard({
                              ...card,
                              image: url || "",
                              imagePublicId: publicId || "",
                            })
                          }
                          scope="vehicle"
                          aspect="4 / 3"
                        />
                      </Field>

                      <Field label="Card Title">
                        <input
                          type="text"
                          value={card.title || ""}
                          onChange={(e) =>
                            updateCard({ ...card, title: e.target.value })
                          }
                          className={inputCls}
                          placeholder="Tempo Traveller For Wedding"
                        />
                      </Field>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Field label="Seats Chip">
                          <input
                            type="text"
                            value={card.seats || ""}
                            onChange={(e) =>
                              updateCard({ ...card, seats: e.target.value })
                            }
                            className={inputCls}
                            placeholder="17 to 26 Seater"
                          />
                        </Field>
                        <Field label="Price Chip">
                          <input
                            type="text"
                            value={card.price || ""}
                            onChange={(e) =>
                              updateCard({ ...card, price: e.target.value })
                            }
                            className={inputCls}
                            placeholder="Starts from ₹21/km"
                          />
                        </Field>
                        <Field label="Location Chip">
                          <input
                            type="text"
                            value={card.location || ""}
                            onChange={(e) =>
                              updateCard({
                                ...card,
                                location: e.target.value,
                              })
                            }
                            className={inputCls}
                            placeholder="Delhi NCR"
                          />
                        </Field>
                      </div>

                      <Field label="Description">
                        <textarea
                          rows={4}
                          value={card.description || ""}
                          onChange={(e) =>
                            updateCard({
                              ...card,
                              description: e.target.value,
                            })
                          }
                          className={inputCls}
                          placeholder="Detailed description..."
                        />
                      </Field>

                      <Field label="Key Features">
                        <StringList
                          items={card.features || []}
                          onChange={(features) =>
                            updateCard({ ...card, features })
                          }
                          placeholder="AC"
                        />
                      </Field>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Book Label">
                          <input
                            type="text"
                            value={card.bookLabel || ""}
                            onChange={(e) =>
                              updateCard({
                                ...card,
                                bookLabel: e.target.value,
                              })
                            }
                            className={inputCls}
                            placeholder="BOOK NOW"
                          />
                        </Field>
                        <Field label="Book Link">
                          <input
                            type="text"
                            value={card.bookLink || ""}
                            onChange={(e) =>
                              updateCard({
                                ...card,
                                bookLink: e.target.value,
                              })
                            }
                            className={inputCls}
                            placeholder="/booking"
                          />
                        </Field>
                        <Field label="Read More Label">
                          <input
                            type="text"
                            value={card.readMoreLabel || ""}
                            onChange={(e) =>
                              updateCard({
                                ...card,
                                readMoreLabel: e.target.value,
                              })
                            }
                            className={inputCls}
                            placeholder="READ MORE"
                          />
                        </Field>
                        <Field label="Read More Link">
                          <input
                            type="text"
                            value={card.readMoreLink || ""}
                            onChange={(e) =>
                              updateCard({
                                ...card,
                                readMoreLink: e.target.value,
                              })
                            }
                            className={inputCls}
                            placeholder="/read-more"
                          />
                        </Field>
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>
          )}
        />
      </div>
    );
  }

  // ============================================================
  // LOOKING FOR OTHER VEHICLE
  // ============================================================
  if (sectionKey === "lookingvehicle") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="LOOKING FOR OTHER VEHICLE?"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Title">
            <input
              type="text"
              value={value.title || ""}
              onChange={(e) => set("title", e.target.value)}
              className={inputCls}
              placeholder="MEET OUR"
            />
          </Field>

          <Field label="Title Highlight (green)">
            <input
              type="text"
              value={value.titleHighlight || ""}
              onChange={(e) => set("titleHighlight", e.target.value)}
              className={inputCls}
              placeholder="AWESOME FLEET"
            />
          </Field>
        </div>

        <Field label="Subtitle (italic green)">
          <input
            type="text"
            value={value.subtitle || ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className={inputCls}
            placeholder="Widest & Finest Range of Vehicles"
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={2}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="in Delhi, Noida, Gurugram & Ghaziabad!"
          />
        </Field>

        <Field label="Load More Button Label">
          <input
            type="text"
            value={value.loadMoreLabel || ""}
            onChange={(e) => set("loadMoreLabel", e.target.value)}
            className={inputCls}
            placeholder="Load More Vehicles"
          />
        </Field>

        <RichList<{
          title: string;
          seats: string;
          image: string;
          imagePublicId: string;
          href: string;
        }>
          label="Vehicles"
          items={value.vehicles || []}
          onChange={(items) => set("vehicles", items)}
          emptyItem={{
            title: "",
            seats: "",
            image: "",
            imagePublicId: "",
            href: "",
          }}
          renderItem={(item, update) => (
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Vehicle Name">
                  <input
                    type="text"
                    value={item.title || ""}
                    onChange={(e) =>
                      update({ ...item, title: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Tempo Traveller"
                  />
                </Field>
                <Field label="Seats">
                  <input
                    type="text"
                    value={item.seats || ""}
                    onChange={(e) =>
                      update({ ...item, seats: e.target.value })
                    }
                    className={inputCls}
                    placeholder="9 to 26 Seater"
                  />
                </Field>
              </div>

              <Field label="Card Link (optional)">
                <input
                  type="text"
                  value={item.href || ""}
                  onChange={(e) =>
                    update({ ...item, href: e.target.value })
                  }
                  className={inputCls}
                  placeholder="/vehicles/tempo-traveller"
                />
              </Field>

              <Field label="Vehicle Image">
                <ImageUpload
                  value={item.image || null}
                  publicId={item.imagePublicId || null}
                  onChange={(url, publicId) =>
                    update({
                      ...item,
                      image: url || "",
                      imagePublicId: publicId || "",
                    })
                  }
                  scope="vehicle"
                  aspect="4 / 3"
                  hint="JPG, PNG, WEBP · Max 300 KB"
                />
              </Field>
            </div>
          )}
        />
      </div>
    );
  }

  // ============================================================
  // COMPARE WITH VEHICLES
  // ============================================================
  if (sectionKey === "compare") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="COMPARE & CHOOSE"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Title">
            <input
              type="text"
              value={value.title || ""}
              onChange={(e) => set("title", e.target.value)}
              className={inputCls}
              placeholder="WHICH VEHICLE SUITS"
            />
          </Field>
          <Field label="Title Highlight (green)">
            <input
              type="text"
              value={value.titleHighlight || ""}
              onChange={(e) => set("titleHighlight", e.target.value)}
              className={inputCls}
              placeholder="YOU BEST?"
            />
          </Field>
        </div>

        <Field label="Subtitle (italic green)">
          <input
            type="text"
            value={value.subtitle || ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className={inputCls}
            placeholder="Compare & Pick the Right One"
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={2}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="Not sure which vehicle to book? Compare features, prices & comfort levels."
          />
        </Field>

        <Field label="VS Label (middle badge)">
          <input
            type="text"
            value={value.vsLabel || ""}
            onChange={(e) => set("vsLabel", e.target.value)}
            className={inputCls}
            placeholder="VS"
          />
        </Field>

        <RichList<ComparePair>
          label="Comparison Cards (pair per slide)"
          items={value.comparisons || []}
          onChange={(items) => set("comparisons", items)}
          emptyItem={{
            cardA: {
              badge: "",
              badgeIcon: "star",
              image: "",
              imagePublicId: "",
              name: "",
              price: "",
              accentColor: "green",
              features: [],
              footerText: "",
              bookLabel: "BOOK NOW",
              bookLink: "",
            },
            cardB: {
              badge: "",
              badgeIcon: "star",
              image: "",
              imagePublicId: "",
              name: "",
              price: "",
              accentColor: "orange",
              features: [],
              footerText: "",
              bookLabel: "BOOK NOW",
              bookLink: "",
            },
          }}
          renderItem={(pair, update) => (
            <div className="space-y-4 p-4 rounded-xl border-2 border-teal-200 bg-teal-50/30">
              {/* CARD A */}
              <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-white">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Card A (Left)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Badge Text">
                    <input
                      type="text"
                      value={pair.cardA?.badge || ""}
                      onChange={(e) =>
                        update({
                          ...pair,
                          cardA: { ...pair.cardA, badge: e.target.value },
                        })
                      }
                      className={inputCls}
                      placeholder="BEST FOR GROUP TRAVEL"
                    />
                  </Field>
                  <Field label="Badge Icon">
                    <select
                      value={pair.cardA?.badgeIcon || "star"}
                      onChange={(e) =>
                        update({
                          ...pair,
                          cardA: {
                            ...pair.cardA,
                            badgeIcon: e.target.value,
                          },
                        })
                      }
                      className={inputCls}
                    >
                      <option value="star">⭐ Star</option>
                      <option value="shield">🛡 Shield</option>
                      <option value="thumbs">👍 Thumbs</option>
                      <option value="crown">👑 Crown</option>
                    </select>
                  </Field>
                </div>

                <Field label="Card Image">
                  <ImageUpload
                    value={pair.cardA?.image || null}
                    publicId={pair.cardA?.imagePublicId || null}
                    onChange={(url, publicId) =>
                      update({
                        ...pair,
                        cardA: {
                          ...pair.cardA,
                          image: url || "",
                          imagePublicId: publicId || "",
                        },
                      })
                    }
                    scope="vehicle"
                    aspect="16 / 9"
                    hint="JPG, PNG, WEBP · Max 300 KB"
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Vehicle Name">
                    <input
                      type="text"
                      value={pair.cardA?.name || ""}
                      onChange={(e) =>
                        update({
                          ...pair,
                          cardA: { ...pair.cardA, name: e.target.value },
                        })
                      }
                      className={inputCls}
                      placeholder="Tempo Traveller"
                    />
                  </Field>
                  <Field label="Price Label">
                    <input
                      type="text"
                      value={pair.cardA?.price || ""}
                      onChange={(e) =>
                        update({
                          ...pair,
                          cardA: { ...pair.cardA, price: e.target.value },
                        })
                      }
                      className={inputCls}
                      placeholder="₹28 per km"
                    />
                  </Field>
                </div>

                <Field label="Accent Color">
                  <select
                    value={pair.cardA?.accentColor || "green"}
                    onChange={(e) =>
                      update({
                        ...pair,
                        cardA: {
                          ...pair.cardA,
                          accentColor: e.target.value,
                        },
                      })
                    }
                    className={inputCls}
                  >
                    <option value="green">Green</option>
                    <option value="orange">Orange</option>
                    <option value="teal">Teal</option>
                    <option value="blue">Blue</option>
                  </select>
                </Field>

                <Field label="Features (rows)">
                  <RichList<CompareFeature>
                    label=""
                    items={pair.cardA?.features || []}
                    onChange={(features) =>
                      update({
                        ...pair,
                        cardA: { ...pair.cardA, features },
                      })
                    }
                    emptyItem={{ icon: "", label: "", value: "" }}
                    renderItem={(feat, updateFeat) => (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50">
                        <Field label="Icon (emoji)">
                          <input
                            type="text"
                            value={feat.icon || ""}
                            onChange={(e) =>
                              updateFeat({ ...feat, icon: e.target.value })
                            }
                            className={inputCls}
                            placeholder="🪑"
                          />
                        </Field>
                        <Field label="Label">
                          <input
                            type="text"
                            value={feat.label || ""}
                            onChange={(e) =>
                              updateFeat({ ...feat, label: e.target.value })
                            }
                            className={inputCls}
                            placeholder="Seating Type"
                          />
                        </Field>
                        <Field label="Value">
                          <input
                            type="text"
                            value={feat.value || ""}
                            onChange={(e) =>
                              updateFeat({ ...feat, value: e.target.value })
                            }
                            className={inputCls}
                            placeholder="12 - 17 seater"
                          />
                        </Field>
                      </div>
                    )}
                  />
                </Field>

                <Field label="Footer Text">
                  <input
                    type="text"
                    value={pair.cardA?.footerText || ""}
                    onChange={(e) =>
                      update({
                        ...pair,
                        cardA: {
                          ...pair.cardA,
                          footerText: e.target.value,
                        },
                      })
                    }
                    className={inputCls}
                    placeholder="Perfect for large groups, events & tours"
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Book Label">
                    <input
                      type="text"
                      value={pair.cardA?.bookLabel || ""}
                      onChange={(e) =>
                        update({
                          ...pair,
                          cardA: {
                            ...pair.cardA,
                            bookLabel: e.target.value,
                          },
                        })
                      }
                      className={inputCls}
                      placeholder="BOOK NOW"
                    />
                  </Field>
                  <Field label="Book Link">
                    <input
                      type="text"
                      value={pair.cardA?.bookLink || ""}
                      onChange={(e) =>
                        update({
                          ...pair,
                          cardA: {
                            ...pair.cardA,
                            bookLink: e.target.value,
                          },
                        })
                      }
                      className={inputCls}
                      placeholder="/booking"
                    />
                  </Field>
                </div>
              </div>

              {/* CARD B */}
              <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-white">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Card B (Right)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Badge Text">
                    <input
                      type="text"
                      value={pair.cardB?.badge || ""}
                      onChange={(e) =>
                        update({
                          ...pair,
                          cardB: { ...pair.cardB, badge: e.target.value },
                        })
                      }
                      className={inputCls}
                      placeholder="BEST FOR ADVENTURE"
                    />
                  </Field>
                  <Field label="Badge Icon">
                    <select
                      value={pair.cardB?.badgeIcon || "star"}
                      onChange={(e) =>
                        update({
                          ...pair,
                          cardB: {
                            ...pair.cardB,
                            badgeIcon: e.target.value,
                          },
                        })
                      }
                      className={inputCls}
                    >
                      <option value="star">⭐ Star</option>
                      <option value="shield">🛡 Shield</option>
                      <option value="thumbs">👍 Thumbs</option>
                      <option value="crown">👑 Crown</option>
                    </select>
                  </Field>
                </div>

                <Field label="Card Image">
                  <ImageUpload
                    value={pair.cardB?.image || null}
                    publicId={pair.cardB?.imagePublicId || null}
                    onChange={(url, publicId) =>
                      update({
                        ...pair,
                        cardB: {
                          ...pair.cardB,
                          image: url || "",
                          imagePublicId: publicId || "",
                        },
                      })
                    }
                    scope="vehicle"
                    aspect="16 / 9"
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Vehicle Name">
                    <input
                      type="text"
                      value={pair.cardB?.name || ""}
                      onChange={(e) =>
                        update({
                          ...pair,
                          cardB: { ...pair.cardB, name: e.target.value },
                        })
                      }
                      className={inputCls}
                      placeholder="SUV"
                    />
                  </Field>
                  <Field label="Price Label">
                    <input
                      type="text"
                      value={pair.cardB?.price || ""}
                      onChange={(e) =>
                        update({
                          ...pair,
                          cardB: { ...pair.cardB, price: e.target.value },
                        })
                      }
                      className={inputCls}
                      placeholder="₹18 per km"
                    />
                  </Field>
                </div>

                <Field label="Accent Color">
                  <select
                    value={pair.cardB?.accentColor || "orange"}
                    onChange={(e) =>
                      update({
                        ...pair,
                        cardB: {
                          ...pair.cardB,
                          accentColor: e.target.value,
                        },
                      })
                    }
                    className={inputCls}
                  >
                    <option value="green">Green</option>
                    <option value="orange">Orange</option>
                    <option value="teal">Teal</option>
                    <option value="blue">Blue</option>
                  </select>
                </Field>

                <Field label="Features (rows)">
                  <RichList<CompareFeature>
                    label=""
                    items={pair.cardB?.features || []}
                    onChange={(features) =>
                      update({
                        ...pair,
                        cardB: { ...pair.cardB, features },
                      })
                    }
                    emptyItem={{ icon: "", label: "", value: "" }}
                    renderItem={(feat, updateFeat) => (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50">
                        <Field label="Icon (emoji)">
                          <input
                            type="text"
                            value={feat.icon || ""}
                            onChange={(e) =>
                              updateFeat({ ...feat, icon: e.target.value })
                            }
                            className={inputCls}
                            placeholder="🪑"
                          />
                        </Field>
                        <Field label="Label">
                          <input
                            type="text"
                            value={feat.label || ""}
                            onChange={(e) =>
                              updateFeat({ ...feat, label: e.target.value })
                            }
                            className={inputCls}
                            placeholder="Seating Type"
                          />
                        </Field>
                        <Field label="Value">
                          <input
                            type="text"
                            value={feat.value || ""}
                            onChange={(e) =>
                              updateFeat({ ...feat, value: e.target.value })
                            }
                            className={inputCls}
                            placeholder="5 - 7 seater"
                          />
                        </Field>
                      </div>
                    )}
                  />
                </Field>

                <Field label="Footer Text">
                  <input
                    type="text"
                    value={pair.cardB?.footerText || ""}
                    onChange={(e) =>
                      update({
                        ...pair,
                        cardB: {
                          ...pair.cardB,
                          footerText: e.target.value,
                        },
                      })
                    }
                    className={inputCls}
                    placeholder="Perfect for hill trips, rough roads & family travel"
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Book Label">
                    <input
                      type="text"
                      value={pair.cardB?.bookLabel || ""}
                      onChange={(e) =>
                        update({
                          ...pair,
                          cardB: {
                            ...pair.cardB,
                            bookLabel: e.target.value,
                          },
                        })
                      }
                      className={inputCls}
                      placeholder="BOOK NOW"
                    />
                  </Field>
                  <Field label="Book Link">
                    <input
                      type="text"
                      value={pair.cardB?.bookLink || ""}
                      onChange={(e) =>
                        update({
                          ...pair,
                          cardB: {
                            ...pair.cardB,
                            bookLink: e.target.value,
                          },
                        })
                      }
                      className={inputCls}
                      placeholder="/booking"
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}
        />
      </div>
    );
  }

  // ============================================================
  // PRICES & CHARGES
  // ============================================================
  if (sectionKey === "prices") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="PRICES & CHARGES"
          />
        </Field>

        <Field label="Title">
          <input
            type="text"
            value={value.title || ""}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="Prices & Charges"
          />
        </Field>

        <Field label="Subtitle (italic green)">
          <input
            type="text"
            value={value.subtitle || ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className={inputCls}
            placeholder="Tempo Traveller Price Details!"
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={3}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="Hire Tempo Traveller in Delhi for every occasion..."
          />
        </Field>

        <Field label="Illustration (right side image)">
          <ImageUpload
            value={value.illustration || null}
            publicId={value.illustrationPublicId || null}
            onChange={(url, publicId) =>
              onChange({
                ...value,
                illustration: url || "",
                illustrationPublicId: publicId || "",
              })
            }
            scope="general"
            aspect="16 / 9"
            hint="Decorative illustration · Max 300 KB"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Column 1 Header">
            <input
              type="text"
              value={value.col1Header || ""}
              onChange={(e) => set("col1Header", e.target.value)}
              className={inputCls}
              placeholder="TEMPO TRAVELLER"
            />
          </Field>
          <Field label="Column 2 Header">
            <input
              type="text"
              value={value.col2Header || ""}
              onChange={(e) => set("col2Header", e.target.value)}
              className={inputCls}
              placeholder="STARTS FROM PRICE/KM"
            />
          </Field>
          <Field label="Column 3 Header">
            <input
              type="text"
              value={value.col3Header || ""}
              onChange={(e) => set("col3Header", e.target.value)}
              className={inputCls}
              placeholder="BOOK NOW"
            />
          </Field>
        </div>

        <RichList<{
          image: string;
          imagePublicId: string;
          seats: string;
          subLabel: string;
          price: string;
          bookLabel: string;
          bookLink: string;
        }>
          label="Price Rows"
          items={value.rows || []}
          onChange={(items) => set("rows", items)}
          emptyItem={{
            image: "",
            imagePublicId: "",
            seats: "",
            subLabel: "",
            price: "",
            bookLabel: "Book Now",
            bookLink: "",
          }}
          renderItem={(row, update) => (
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Seats (main label)">
                  <input
                    type="text"
                    value={row.seats || ""}
                    onChange={(e) =>
                      update({ ...row, seats: e.target.value })
                    }
                    className={inputCls}
                    placeholder="9 Seater"
                  />
                </Field>
                <Field label="Sub-label">
                  <input
                    type="text"
                    value={row.subLabel || ""}
                    onChange={(e) =>
                      update({ ...row, subLabel: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Tempo Traveller"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Price">
                  <input
                    type="text"
                    value={row.price || ""}
                    onChange={(e) =>
                      update({ ...row, price: e.target.value })
                    }
                    className={inputCls}
                    placeholder="₹21"
                  />
                </Field>
                <Field label="Book Label">
                  <input
                    type="text"
                    value={row.bookLabel || ""}
                    onChange={(e) =>
                      update({ ...row, bookLabel: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Book Now"
                  />
                </Field>
              </div>

              <Field label="Book Link">
                <input
                  type="text"
                  value={row.bookLink || ""}
                  onChange={(e) =>
                    update({ ...row, bookLink: e.target.value })
                  }
                  className={inputCls}
                  placeholder="/booking"
                />
              </Field>

              <Field label="Row Image (small thumbnail)">
                <ImageUpload
                  value={row.image || null}
                  publicId={row.imagePublicId || null}
                  onChange={(url, publicId) =>
                    update({
                      ...row,
                      image: url || "",
                      imagePublicId: publicId || "",
                    })
                  }
                  scope="vehicle"
                  aspect="4 / 3"
                  variant="compact"
                  hint="JPG, PNG, WEBP · Max 300 KB"
                />
              </Field>
            </div>
          )}
        />
      </div>
    );
  }

  // ============================================================
  // WHY CHOOSE URBAN CRUISE
  // ============================================================
  if (sectionKey === "whychoose") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="WHY CHOOSE URBAN CRUISE"
          />
        </Field>
        <Field label="Title">
          <input
            type="text"
            value={value.title || ""}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="WHY CHOOSE URBAN CRUISE"
          />
        </Field>
        <Field label="Subtitle">
          <input
            type="text"
            value={value.subtitle || ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className={inputCls}
            placeholder="Reliable, Comfortable & Hassle-Free Travel"
          />
        </Field>
        <Field label="Description">
          <textarea
            rows={3}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="Choose Urban Cruise..."
          />
        </Field>

        <RichList<WhyChooseBenefit>
          label="Benefit Cards"
          items={value.benefits || []}
          onChange={(items) => set("benefits", items)}
          emptyItem={{
            number: "",
            title: "",
            color: "green",
            items: [],
            image: "",
            imagePublicId: "",
          }}
          renderItem={(item, update) => (
            <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Number">
                  <input
                    type="text"
                    value={item.number || ""}
                    onChange={(e) =>
                      update({ ...item, number: e.target.value })
                    }
                    className={inputCls}
                    placeholder="01"
                  />
                </Field>
                <Field label="Badge Color">
                  <select
                    value={item.color || "green"}
                    onChange={(e) =>
                      update({ ...item, color: e.target.value })
                    }
                    className={inputCls}
                  >
                    <option value="green">Green</option>
                    <option value="orange">Orange</option>
                    <option value="teal">Teal</option>
                    <option value="blue">Blue</option>
                  </select>
                </Field>
              </div>
              <Field label="Title">
                <input
                  type="text"
                  value={item.title || ""}
                  onChange={(e) =>
                    update({ ...item, title: e.target.value })
                  }
                  className={inputCls}
                  placeholder="WIDEST RANGE OF VEHICLES"
                />
              </Field>
              <Field label="Checklist Items">
                <StringList
                  items={item.items || []}
                  onChange={(items) => update({ ...item, items })}
                  placeholder="5 seater to 56 seater..."
                />
              </Field>
              <Field label="Card Illustration">
                <ImageUpload
                  value={item.image || null}
                  publicId={item.imagePublicId || null}
                  onChange={(url, publicId) =>
                    update({
                      ...item,
                      image: url || "",
                      imagePublicId: publicId || "",
                    })
                  }
                  scope="general"
                  aspect="1 / 1"
                />
              </Field>
            </div>
          )}
        />
      </div>
    );
  }

  // ============================================================
  // TESTIMONIALS
  // ============================================================
  if (sectionKey === "testimonials") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="WHAT OUR CUSTOMERS SAY"
          />
        </Field>
        <Field label="Title">
          <input
            type="text"
            value={value.title || ""}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="REAL PEOPLE. REAL EXPERIENCES."
          />
        </Field>
        <Field label="Subtitle">
          <input
            type="text"
            value={value.subtitle || ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className={inputCls}
            placeholder="Hear from our happy customers"
          />
        </Field>
        <Field label="Description">
          <textarea
            rows={3}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="We take pride in..."
          />
        </Field>

        <RichList<{
          name: string;
          location: string;
          message: string;
          rating: number;
          avatar: string;
          avatarPublicId: string;
          featured: boolean;
          youtubeUrl: string;
        }>
          label="Testimonials"
          items={value.items || []}
          onChange={(items) => set("items", items)}
          emptyItem={{
            name: "",
            location: "",
            message: "",
            rating: 5,
            avatar: "",
            avatarPublicId: "",
            featured: false,
            youtubeUrl: "",
          }}
          renderItem={(item, update) => (
            <div
              className={`space-y-4 p-4 rounded-xl border ${
                item.featured
                  ? "border-teal-300 bg-teal-50/40"
                  : "border-slate-200 bg-slate-50/50"
              }`}
            >
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={Boolean(item.featured)}
                  onChange={(e) =>
                    update({ ...item, featured: e.target.checked })
                  }
                  className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Featured Card
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Name">
                  <input
                    type="text"
                    value={item.name || ""}
                    onChange={(e) =>
                      update({ ...item, name: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Priya Mehta"
                  />
                </Field>
                <Field label="Location">
                  <input
                    type="text"
                    value={item.location || ""}
                    onChange={(e) =>
                      update({ ...item, location: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Gurugram"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Rating (1-5)">
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={item.rating ?? 5}
                    onChange={(e) =>
                      update({
                        ...item,
                        rating: Number(e.target.value),
                      })
                    }
                    className={inputCls}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Message">
                    <textarea
                      rows={4}
                      value={item.message || ""}
                      onChange={(e) =>
                        update({ ...item, message: e.target.value })
                      }
                      className={inputCls}
                      placeholder="Testimonial text..."
                    />
                  </Field>
                </div>
              </div>

              <Field label="Avatar">
                <ImageUpload
                  value={item.avatar || null}
                  publicId={item.avatarPublicId || null}
                  onChange={(url, publicId) =>
                    update({
                      ...item,
                      avatar: url || "",
                      avatarPublicId: publicId || "",
                    })
                  }
                  scope="general"
                  aspect="1 / 1"
                  variant="compact"
                />
              </Field>

              <Field label="YouTube Video URL">
                <input
                  type="text"
                  value={item.youtubeUrl || ""}
                  onChange={(e) =>
                    update({ ...item, youtubeUrl: e.target.value })
                  }
                  className={inputCls}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                {item.youtubeUrl && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    {extractYouTubeId(item.youtubeUrl) ? (
                      <>
                        <p className="text-[11px] text-slate-500 mb-2">
                          ✅ Video ID:{" "}
                          <span className="font-mono text-slate-700">
                            {extractYouTubeId(item.youtubeUrl)}
                          </span>
                        </p>
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-200">
                          <iframe
                            src={`https://www.youtube.com/embed/${extractYouTubeId(
                              item.youtubeUrl
                            )}`}
                            title="YouTube preview"
                            className="absolute inset-0 w-full h-full"
                            allowFullScreen
                          />
                        </div>
                      </>
                    ) : (
                      <p className="text-[11px] text-red-600">
                        ⚠️ Invalid YouTube URL
                      </p>
                    )}
                  </div>
                )}
              </Field>
            </div>
          )}
        />
      </div>
    );
  }

  // ============================================================
  // DISCOVER YOUR NEXT ADVENTURE
  // ============================================================
  if (sectionKey === "discover") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="DISCOVER YOUR NEXT ADVENTURE"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Title">
            <input
              type="text"
              value={value.title || ""}
              onChange={(e) => set("title", e.target.value)}
              className={inputCls}
              placeholder="EXPLORE. DREAM."
            />
          </Field>

          <Field label="Title Highlight (green)">
            <input
              type="text"
              value={value.titleHighlight || ""}
              onChange={(e) => set("titleHighlight", e.target.value)}
              className={inputCls}
              placeholder="DISCOVER."
            />
          </Field>
        </div>

        <Field label="Subtitle (italic green)">
          <input
            type="text"
            value={value.subtitle || ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className={inputCls}
            placeholder="Unforgettable journeys await you"
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={2}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="We take pride in delivering comfortable rides..."
          />
        </Field>

        <Field label="Tabs Label (small caption)">
          <input
            type="text"
            value={value.tabsLabel || ""}
            onChange={(e) => set("tabsLabel", e.target.value)}
            className={inputCls}
            placeholder="EXPLORE PLACES"
          />
        </Field>

        <RichList<DiscoverPlace>
          label="Places (Tabs + Cards)"
          items={value.places || []}
          onChange={(items) => set("places", items)}
          emptyItem={{
            tabLabel: "",
            tabSlug: "",
            placeName: "",
            tagline: "",
            description: "",
            images: [],
            duration: "",
            bestTime: "",
            bestFor: "",
            highlights: [],
          }}
          renderItem={(place, update) => (
            <div className="space-y-4 p-4 rounded-xl border-2 border-teal-200 bg-teal-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Tab Label">
                  <input
                    type="text"
                    value={place.tabLabel || ""}
                    onChange={(e) =>
                      update({ ...place, tabLabel: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Rajasthan"
                  />
                </Field>
                <Field label="Tab Slug">
                  <input
                    type="text"
                    value={place.tabSlug || ""}
                    onChange={(e) =>
                      update({ ...place, tabSlug: e.target.value })
                    }
                    className={inputCls}
                    placeholder="rajasthan"
                  />
                </Field>
              </div>

              <Field label="Place Name">
                <input
                  type="text"
                  value={place.placeName || ""}
                  onChange={(e) =>
                    update({ ...place, placeName: e.target.value })
                  }
                  className={inputCls}
                  placeholder="Royal Rajasthan"
                />
              </Field>

              <Field label="Tagline (italic green)">
                <input
                  type="text"
                  value={place.tagline || ""}
                  onChange={(e) =>
                    update({ ...place, tagline: e.target.value })
                  }
                  className={inputCls}
                  placeholder="Where history meets timeless beauty"
                />
              </Field>

              <Field label="Description">
                <textarea
                  rows={4}
                  value={place.description || ""}
                  onChange={(e) =>
                    update({ ...place, description: e.target.value })
                  }
                  className={inputCls}
                  placeholder="Discover the royal charm of Rajasthan..."
                />
              </Field>

              <Field label="Stacked Images (up to 3)">
                <ImageList
                  items={place.images || []}
                  onChange={(images) => update({ ...place, images })}
                  scope="general"
                  aspect="3 / 4"
                  maxImages={3}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Duration">
                  <input
                    type="text"
                    value={place.duration || ""}
                    onChange={(e) =>
                      update({ ...place, duration: e.target.value })
                    }
                    className={inputCls}
                    placeholder="8-12 Days"
                  />
                </Field>
                <Field label="Best Time">
                  <input
                    type="text"
                    value={place.bestTime || ""}
                    onChange={(e) =>
                      update({ ...place, bestTime: e.target.value })
                    }
                    className={inputCls}
                    placeholder="October to March"
                  />
                </Field>
                <Field label="Best For">
                  <input
                    type="text"
                    value={place.bestFor || ""}
                    onChange={(e) =>
                      update({ ...place, bestFor: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Heritage, Culture, Photography"
                  />
                </Field>
              </div>

              <Field label="Tour Highlights">
                <StringList
                  items={place.highlights || []}
                  onChange={(highlights) =>
                    update({ ...place, highlights })
                  }
                  placeholder="Amer Fort"
                />
              </Field>
            </div>
          )}
        />
      </div>
    );
  }

  // ============================================================
  // FAQS
  // ============================================================
  if (sectionKey === "faq") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="HELP & SUPPORT"
          />
        </Field>
        <Field label="Title">
          <input
            type="text"
            value={value.title || ""}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="FAQs"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Title Highlight">
            <input
              type="text"
              value={value.titleHighlight || ""}
              onChange={(e) => set("titleHighlight", e.target.value)}
              className={inputCls}
              placeholder="Frequently Asked"
            />
          </Field>
          <Field label="Title Accent">
            <input
              type="text"
              value={value.titleAccent || ""}
              onChange={(e) => set("titleAccent", e.target.value)}
              className={inputCls}
              placeholder="Question"
            />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            rows={3}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="Everything you need to know..."
          />
        </Field>

        <RichList<{
          number: string;
          question: string;
          answer: string;
        }>
          label="FAQ items"
          items={value.items || []}
          onChange={(items) => set("items", items)}
          emptyItem={{ number: "", question: "", answer: "" }}
          renderItem={(item, update) => (
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Number">
                  <input
                    type="text"
                    value={item.number || ""}
                    onChange={(e) =>
                      update({ ...item, number: e.target.value })
                    }
                    className={inputCls}
                    placeholder="01"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Question">
                    <input
                      type="text"
                      value={item.question || ""}
                      onChange={(e) =>
                        update({ ...item, question: e.target.value })
                      }
                      className={inputCls}
                      placeholder="What documents do I need?"
                    />
                  </Field>
                </div>
              </div>
              <Field label="Answer (rich text)">
                <RichEditor
                  value={normalizeToEditorDoc(item.answer || "")}
                  onChange={(data) =>
                    update({
                      ...item,
                      answer: editorDocToPlain(data),
                    })
                  }
                  placeholder="Write the answer..."
                  minHeight={120}
                />
              </Field>
            </div>
          )}
        />
      </div>
    );
  }

  // ============================================================
  // SERVICE LOCATIONS
  // ============================================================
  if (sectionKey === "servicelocations") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="Pan-India Presence"
          />
        </Field>
        <Field label="Title">
          <input
            type="text"
            value={value.title || ""}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="INDIA COVERAGE"
          />
        </Field>
        <Field label="Subtitle">
          <input
            type="text"
            value={value.subtitle || ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className={inputCls}
            placeholder="Explore our presence across India"
          />
        </Field>
        <Field label="Description">
          <textarea
            rows={3}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="Intro copy"
          />
        </Field>

        <RichList<{
          name: string;
          state: string;
          image: string;
          imagePublicId: string;
        }>
          label="Cities"
          items={value.cities || []}
          onChange={(items) => set("cities", items)}
          emptyItem={{ name: "", state: "", image: "", imagePublicId: "" }}
          renderItem={(item, update) => (
            <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="City Name">
                  <input
                    type="text"
                    value={item.name || ""}
                    onChange={(e) =>
                      update({ ...item, name: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Delhi"
                  />
                </Field>
                <Field label="State">
                  <input
                    type="text"
                    value={item.state || ""}
                    onChange={(e) =>
                      update({ ...item, state: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Delhi NCR"
                  />
                </Field>
              </div>
              <Field label="City Image">
                <ImageUpload
                  value={item.image || null}
                  publicId={item.imagePublicId || null}
                  onChange={(url, publicId) =>
                    update({
                      ...item,
                      image: url || "",
                      imagePublicId: publicId || "",
                    })
                  }
                  scope="general"
                  aspect="4 / 3"
                />
              </Field>
            </div>
          )}
        />
      </div>
    );
  }

  // ============================================================
  // PARTNERS
  // ============================================================
  if (sectionKey === "partners") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="Trusted By"
          />
        </Field>
        <Field label="Title">
          <input
            type="text"
            value={value.title || ""}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="Trusted by 100+ Companies"
          />
        </Field>
        <Field label="Subtitle">
          <input
            type="text"
            value={value.subtitle || ""}
            onChange={(e) => set("subtitle", e.target.value)}
            className={inputCls}
            placeholder="India's most trusted travel partner"
          />
        </Field>
        <Field label="Description">
          <textarea
            rows={3}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="We are proud to partner with..."
          />
        </Field>

        <RichList<{
          name: string;
          logo: string;
          logoPublicId: string;
        }>
          label="Partner logos"
          items={value.logos || []}
          onChange={(items) => set("logos", items)}
          emptyItem={{ name: "", logo: "", logoPublicId: "" }}
          renderItem={(item, update) => (
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <Field label="Partner Name">
                <input
                  type="text"
                  value={item.name || ""}
                  onChange={(e) =>
                    update({ ...item, name: e.target.value })
                  }
                  className={inputCls}
                  placeholder="TATA"
                />
              </Field>
              <Field label="Logo">
                <ImageUpload
                  value={item.logo || null}
                  publicId={item.logoPublicId || null}
                  onChange={(url, publicId) =>
                    update({
                      ...item,
                      logo: url || "",
                      logoPublicId: publicId || "",
                    })
                  }
                  scope="partner"
                  aspect="3 / 2"
                  variant="compact"
                />
              </Field>
            </div>
          )}
        />
      </div>
    );
  }

  // ============================================================
  // DOWNLOAD APP
  // ============================================================
  if (sectionKey === "downloadapp") {
    return (
      <div className="space-y-5">
        <Field label="Eyebrow">
          <input
            type="text"
            value={value.eyebrow || ""}
            onChange={(e) => set("eyebrow", e.target.value)}
            className={inputCls}
            placeholder="DOWNLOAD OUR APP"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Title">
            <input
              type="text"
              value={value.title || ""}
              onChange={(e) => set("title", e.target.value)}
              className={inputCls}
              placeholder="Your Journey,"
            />
          </Field>
          <Field label="Title Highlight">
            <input
              type="text"
              value={value.titleHighlight || ""}
              onChange={(e) => set("titleHighlight", e.target.value)}
              className={inputCls}
              placeholder="Simplified."
            />
          </Field>
        </div>
        <Field label="Accent">
          <input
            type="text"
            value={value.accent || ""}
            onChange={(e) => set("accent", e.target.value)}
            className={inputCls}
            placeholder="In Your Pocket."
          />
        </Field>
        <Field label="Description">
          <textarea
            rows={3}
            value={value.description || ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputCls}
            placeholder="Book rides, track in real-time..."
          />
        </Field>

        <RichList<{
          icon: string;
          title: string;
          subtitle: string;
        }>
          label="Feature Cards"
          items={value.features || []}
          onChange={(items) => set("features", items)}
          emptyItem={{ icon: "", title: "", subtitle: "" }}
          renderItem={(item, update) => (
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Icon">
                  <input
                    type="text"
                    value={item.icon || ""}
                    onChange={(e) =>
                      update({ ...item, icon: e.target.value })
                    }
                    className={inputCls}
                    placeholder="📅"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Title">
                    <input
                      type="text"
                      value={item.title || ""}
                      onChange={(e) =>
                        update({ ...item, title: e.target.value })
                      }
                      className={inputCls}
                      placeholder="Easy Booking"
                    />
                  </Field>
                </div>
              </div>
              <Field label="Subtitle">
                <input
                  type="text"
                  value={item.subtitle || ""}
                  onChange={(e) =>
                    update({ ...item, subtitle: e.target.value })
                  }
                  className={inputCls}
                  placeholder="Book in just a few taps"
                />
              </Field>
            </div>
          )}
        />

        <Field label="App Logo">
          <ImageUpload
            value={value.appLogo || null}
            publicId={value.appLogoPublicId || null}
            onChange={(url, publicId) =>
              onChange({
                ...value,
                appLogo: url || "",
                appLogoPublicId: publicId || "",
              })
            }
            scope="general"
            aspect="1 / 1"
            variant="compact"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Google Play URL">
            <input
              type="text"
              value={value.googlePlayUrl || value.androidUrl || ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  googlePlayUrl: e.target.value,
                  androidUrl: e.target.value,
                })
              }
              className={inputCls}
              placeholder="https://play.google.com/..."
            />
          </Field>
          <Field label="App Store URL">
            <input
              type="text"
              value={value.appStoreUrl || value.iosUrl || ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  appStoreUrl: e.target.value,
                  iosUrl: e.target.value,
                })
              }
              className={inputCls}
              placeholder="https://apps.apple.com/..."
            />
          </Field>
        </div>

        <Field label="QR Code Image">
          <ImageUpload
            value={value.qrCode || null}
            publicId={value.qrCodePublicId || null}
            onChange={(url, publicId) =>
              onChange({
                ...value,
                qrCode: url || "",
                qrCodePublicId: publicId || "",
              })
            }
            scope="general"
            aspect="1 / 1"
            variant="compact"
          />
        </Field>

        <RichList<{
          icon: string;
          value: string;
          label: string;
        }>
          label="Stats"
          items={value.stats || []}
          onChange={(items) => set("stats", items)}
          emptyItem={{ icon: "", value: "", label: "" }}
          renderItem={(item, update) => (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <Field label="Icon">
                <input
                  type="text"
                  value={item.icon || ""}
                  onChange={(e) =>
                    update({ ...item, icon: e.target.value })
                  }
                  className={inputCls}
                  placeholder="⬇"
                />
              </Field>
              <Field label="Value">
                <input
                  type="text"
                  value={item.value || ""}
                  onChange={(e) =>
                    update({ ...item, value: e.target.value })
                  }
                  className={inputCls}
                  placeholder="10K+"
                />
              </Field>
              <Field label="Label">
                <input
                  type="text"
                  value={item.label || ""}
                  onChange={(e) =>
                    update({ ...item, label: e.target.value })
                  }
                  className={inputCls}
                  placeholder="Downloads"
                />
              </Field>
            </div>
          )}
        />

        <Field label="Phone Mockup">
          <ImageUpload
            value={value.phoneMockup || value.appImage || null}
            publicId={
              value.phoneMockupPublicId || value.appImagePublicId || null
            }
            onChange={(url, publicId) =>
              onChange({
                ...value,
                phoneMockup: url || "",
                phoneMockupPublicId: publicId || "",
              })
            }
            scope="general"
            aspect="9 / 16"
          />
        </Field>
      </div>
    );
  }

  // ============================================================
  // FALLBACK
  // ============================================================
  return (
    <div>
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
        No custom form for <code>{sectionKey}</code>. Switch to the JSON tab to
        edit raw content.
      </p>
      <pre className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-auto max-h-[400px]">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

// ============================================================
// Reusable sub-components
// ============================================================

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <span className="block text-xs font-medium text-slate-700 mb-1.5">
        {label}
      </span>
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="border-t border-slate-100 pt-5 first:border-0 first:pt-0">
      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
        {title}
      </h3>
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

export function RichList<T>({
  label,
  items,
  onChange,
  renderItem,
  emptyItem,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (
    item: T,
    update: (next: T) => void,
    remove: () => void
  ) => React.ReactNode;
  emptyItem: T;
}) {
  const add = () => {
    onChange([...items, JSON.parse(JSON.stringify(emptyItem))]);
  };

  const update = (index: number, next: T) => {
    const copy = [...items];
    copy[index] = next;
    onChange(copy);
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-700">{label}</span>
          <button
            type="button"
            onClick={add}
            className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            <MdOutlineAdd className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      )}
      {!label && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={add}
            className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            <MdOutlineAdd className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-xs text-slate-400 italic">
          No items yet — click Add to create one.
        </p>
      ) : (
        items.map((item, i) => (
          <div key={i} className="relative">
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-colors"
              title="Remove"
              aria-label="Remove"
            >
              <MdOutlineRemove className="w-3.5 h-3.5" />
            </button>

            {renderItem(
              item,
              (next) => update(i, next),
              () => remove(i)
            )}
          </div>
        ))
      )}
    </div>
  );
}

export function StringList({
  items,
  onChange,
  placeholder = "Add item",
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  const add = () => onChange([...items, ""]);
  const update = (index: number, value: string) => {
    const copy = [...items];
    copy[index] = value;
    onChange(copy);
  };
  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={item}
            onChange={(e) => update(i, e.target.value)}
            className={inputCls}
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors"
            aria-label="Remove"
          >
            <MdOutlineRemove className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
      >
        <MdOutlineAdd className="w-3.5 h-3.5" />
        Add item
      </button>
    </div>
  );
}

export function JsonEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-2">
        Raw JSON view of this section. Edit carefully — invalid JSON will
        prevent saving.
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[560px] font-mono text-xs p-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50"
        spellCheck={false}
      />
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================
export function normalizeToEditorDoc(input: any) {
  if (!input) return undefined;
  if (typeof input === "object" && Array.isArray(input.blocks)) return input;
  if (typeof input === "string") {
    return {
      time: Date.now(),
      blocks: [{ type: "paragraph", data: { text: input } }],
      version: "2.28.0",
    };
  }
  return {
    time: Date.now(),
    blocks: [
      { type: "paragraph", data: { text: JSON.stringify(input) } },
    ],
    version: "2.28.0",
  };
}

export function editorDocToPlain(doc: any): string {
  if (!doc || !Array.isArray(doc.blocks)) return "";
  return doc.blocks
    .map((block: any) => {
      const d = block.data || {};
      switch (block.type) {
        case "paragraph":
        case "header":
          return stripHtml(d.text || "");
        case "list":
          return (d.items || [])
            .map((it: any) => {
              const text = typeof it === "string" ? it : it.content || "";
              return `• ${stripHtml(text)}`;
            })
            .join("\n");
        case "quote":
          return stripHtml(d.text || "");
        case "checklist":
          return (d.items || [])
            .map(
              (it: any) =>
                `${it.checked ? "☑" : "☐"} ${stripHtml(it.text || "")}`
            )
            .join("\n");
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}