"use client";

import { useState, type FormEvent } from "react";
import useSWR from "swr";
import {
  MdOutlineAdd,
  MdOutlineArticle,
  MdOutlineDelete,
  MdOutlineEdit,
  MdOutlineSave,
  MdOutlineSearch,
} from "react-icons/md";
import { api } from "@/lib/api";
import { fetcher } from "@/lib/swr-config";
import ImageUpload from "@/app/components/UI/ImageUpload";
import BlogRichTextEditor from "./BlogRichTextEditor";
import { WEBSITE_BLOG_CATEGORIES } from "@/lib/website-blogs";

const inputCls =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

interface WebsiteBlog {
  id: number;
  title: string;
  paragraph: string;
  image_url: string;
  image_public_id: string;
  categories: string[];
  citySlugs: string[];
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}

interface BlogCity {
  name: string;
  slug: string;
}

interface BlogsResponse {
  blogs: WebsiteBlog[];
  cities: BlogCity[];
  total: number;
}

interface BlogFormValues {
  title: string;
  paragraph: string;
  imageUrl: string;
  imagePublicId: string;
  categories: string[];
  citySlugs: string[];
  status: "draft" | "published";
}

const BLOGS_PER_PAGE = 10;

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function getParagraphPreview(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function WebsiteBlogPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editorBlog, setEditorBlog] = useState<WebsiteBlog | null | undefined>();
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const query = new URLSearchParams({
    limit: String(BLOGS_PER_PAGE),
    offset: String((page - 1) * BLOGS_PER_PAGE),
  });
  if (search.trim()) query.set("search", search.trim());
  if (categoryFilter) query.set("category", categoryFilter);
  if (cityFilter) query.set("city", cityFilter);

  const { data, error, isLoading, mutate } = useSWR<BlogsResponse>(
    `/api/admin/website/blogs?${query.toString()}`,
    fetcher
  );
  const blogs = data?.blogs ?? [];
  const cities = data?.cities ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / BLOGS_PER_PAGE);

  const saveBlog = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editorBlog === undefined) return;

    const formData = new FormData(event.currentTarget);
    const values: BlogFormValues = {
      title: String(formData.get("title") || "").trim(),
      paragraph: String(formData.get("paragraph") || "").trim(),
      imageUrl: String(formData.get("imageUrl") || ""),
      imagePublicId: String(formData.get("imagePublicId") || ""),
      categories: selectedCategories,
      citySlugs: selectedCities,
      status: String(formData.get("status")) as BlogFormValues["status"],
    };

    if (!values.imageUrl) {
      setActionError("Please upload a blog image.");
      return;
    }
    if (values.categories.length === 0) {
      setActionError("Choose at least one category.");
      return;
    }
    if (values.citySlugs.length === 0) {
      setActionError("Choose at least one city.");
      return;
    }
    if (!getParagraphPreview(values.paragraph)) {
      setActionError("Paragraph is required.");
      return;
    }

    setSaving(true);
    setActionError("");
    try {
      await api(
        editorBlog
          ? `/api/admin/website/blogs/${editorBlog.id}`
          : "/api/admin/website/blogs",
        {
          method: editorBlog ? "PUT" : "POST",
          body: values,
        }
      );
      setEditorBlog(undefined);
      await mutate();
    } catch (saveError) {
      setActionError(
        saveError instanceof Error ? saveError.message : "Could not save blog post."
      );
    } finally {
      setSaving(false);
    }
  };

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const openNewBlog = () => {
    setActionError("");
    setSelectedCategories([]);
    setSelectedCities([]);
    setEditorBlog(null);
  };

  const openEditBlog = (blog: WebsiteBlog) => {
    setActionError("");
    setSelectedCategories(blog.categories);
    setSelectedCities(blog.citySlugs);
    setEditorBlog(blog);
  };

  const deleteBlog = async (blog: WebsiteBlog) => {
    if (!window.confirm(`Delete "${blog.title}"? This cannot be undone.`)) return;

    setDeletingId(blog.id);
    setActionError("");
    try {
      await api(`/api/admin/website/blogs/${blog.id}`, { method: "DELETE" });
      const refreshed = await mutate();
      const lastPage = Math.max(
        1,
        Math.ceil((refreshed?.total ?? 0) / BLOGS_PER_PAGE)
      );
      if (page > lastPage) setPage(lastPage);
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error ? deleteError.message : "Could not delete blog post."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50">
            <MdOutlineArticle className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Website Blog</h1>
            <p className="mt-1 text-sm text-slate-500">
              Create and publish blog posts on the Urban Cruise website.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openNewBlog}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          <MdOutlineAdd className="h-5 w-5" />
          Add Blog
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full flex-wrap gap-3 sm:w-auto">
          <div className="relative w-full sm:w-64">
            <MdOutlineSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search title or paragraph"
              aria-label="Search blog posts"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by category"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          >
            <option value="">All categories</option>
            {WEBSITE_BLOG_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={cityFilter}
            onChange={(event) => {
              setCityFilter(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by city"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          >
            <option value="">All cities</option>
            {cities.map((city) => (
              <option key={city.slug} value={city.slug}>
                {city.name}
              </option>
            ))}
          </select>
          {(categoryFilter || cityFilter || search) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategoryFilter("");
                setCityFilter("");
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Clear filters
            </button>
          )}
        </div>
        <p className="text-sm text-slate-500">
          {isLoading ? "Loading blog posts..." : `${total} blog posts`}
        </p>
      </div>

      {(error || actionError) && (
        <div role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {actionError || `Could not load blog posts: ${error.message}`}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Blog</th>
                <th className="px-4 py-3 font-semibold">Categories</th>
                <th className="px-4 py-3 font-semibold">Cities</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!isLoading && blogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No blog posts found. Add one to publish it on the website.
                  </td>
                </tr>
              )}
              {blogs.map((blog) => (
                <tr key={blog.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        role="img"
                        aria-label={blog.title}
                        className="h-12 w-16 shrink-0 rounded-md bg-cover bg-center bg-slate-100"
                        style={{ backgroundImage: `url("${blog.image_url}")` }}
                      />
                      <div className="max-w-md">
                        <p className="font-semibold text-slate-900">{blog.title}</p>
                        <p className="line-clamp-2 text-xs text-slate-500">
                          {getParagraphPreview(blog.paragraph)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-xs flex-wrap gap-1">
                      {blog.categories.map((category) => (
                        <span
                          key={category}
                          className="rounded-full bg-teal-50 px-2 py-1 text-[11px] text-teal-700"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-xs flex-wrap gap-1">
                      {blog.citySlugs.length === 0 && (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                          All cities
                        </span>
                      )}
                      {blog.citySlugs.map((slug) => (
                        <span
                          key={slug}
                          className="rounded-full bg-sky-50 px-2 py-1 text-[11px] text-sky-700"
                        >
                          {cities.find((city) => city.slug === slug)?.name || slug}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        blog.status === "published"
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {blog.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                    {formatDate(blog.updated_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditBlog(blog)}
                        disabled={deletingId === blog.id || saving}
                        className="rounded-lg p-2 text-slate-500 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-40"
                        aria-label={`Edit ${blog.title}`}
                        title="Edit"
                      >
                        <MdOutlineEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteBlog(blog)}
                        disabled={deletingId === blog.id || saving}
                        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        aria-label={`Delete ${blog.title}`}
                        title="Delete"
                      >
                        <MdOutlineDelete className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-sm text-slate-500">
              Showing {(page - 1) * BLOGS_PER_PAGE + 1}-
              {Math.min(page * BLOGS_PER_PAGE, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1 || isLoading}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages || isLoading}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {editorBlog !== undefined && (
        <BlogEditor
          key={editorBlog?.id ?? "new"}
          initialBlog={editorBlog}
          categories={selectedCategories}
          setCategories={setSelectedCategories}
          cities={cities}
          selectedCities={selectedCities}
          setSelectedCities={setSelectedCities}
          saving={saving}
          error={actionError}
          onSubmit={saveBlog}
          onClose={() => {
            if (!saving) {
              setEditorBlog(undefined);
              setActionError("");
            }
          }}
        />
      )}
    </div>
  );
}

function BlogEditor({
  initialBlog,
  categories,
  setCategories,
  cities,
  selectedCities,
  setSelectedCities,
  saving,
  error,
  onSubmit,
  onClose,
}: {
  initialBlog: WebsiteBlog | null;
  categories: string[];
  setCategories: (categories: string[]) => void;
  cities: BlogCity[];
  selectedCities: string[];
  setSelectedCities: (cities: string[]) => void;
  saving: boolean;
  error: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  const [imageUrl, setImageUrl] = useState(initialBlog?.image_url || "");
  const [paragraph, setParagraph] = useState(initialBlog?.paragraph || "");
  const [imagePublicId, setImagePublicId] = useState(
    initialBlog?.image_public_id || ""
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form
        onSubmit={onSubmit}
        className="flex max-h-[94vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {initialBlog ? "Edit Blog" : "Add Blog"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Add a title, paragraph, image, categories, and one or more cities.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {error && (
            <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Title</span>
            <input
              name="title"
              required
              maxLength={255}
              defaultValue={initialBlog?.title || ""}
              className={inputCls}
              placeholder="Blog title"
            />
          </label>
          <div className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Paragraph</span>
            <BlogRichTextEditor value={paragraph} onChange={setParagraph} />
            <input type="hidden" name="paragraph" value={paragraph} readOnly />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Blog Image</p>
            <ImageUpload
              value={imageUrl || null}
              publicId={imagePublicId || null}
              onChange={(url, publicId) => {
                setImageUrl(url || "");
                setImagePublicId(publicId || "");
              }}
              scope="general"
              aspect="16 / 9"
            />
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">
              Categories <span className="font-normal text-slate-500">(select one or more)</span>
            </legend>
            <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
              {WEBSITE_BLOG_CATEGORIES.map((category) => (
                <label key={category} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={categories.includes(category)}
                    onChange={(event) =>
                      setCategories(
                        event.target.checked
                          ? [...categories, category]
                          : categories.filter((item) => item !== category)
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  {category}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">
              Cities <span className="font-normal text-slate-500">(select one or more)</span>
            </legend>
            {cities.length === 0 ? (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                No active cities are available. Add or activate a city before saving this blog.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
                {cities.map((city) => (
                  <label key={city.slug} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedCities.includes(city.slug)}
                      onChange={(event) =>
                        setSelectedCities(
                          event.target.checked
                            ? [...selectedCities, city.slug]
                            : selectedCities.filter((slug) => slug !== city.slug)
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    {city.name}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select
              name="status"
              defaultValue={initialBlog?.status || "draft"}
              className={inputCls}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
        </div>

        <input type="hidden" name="imageUrl" value={imageUrl} readOnly />
        <input type="hidden" name="imagePublicId" value={imagePublicId} readOnly />
        <div className="flex justify-end gap-2 border-t border-slate-200 p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            <MdOutlineSave className="h-4 w-4" />
            {saving ? "Saving..." : "Save Blog"}
          </button>
        </div>
      </form>
    </div>
  );
}
