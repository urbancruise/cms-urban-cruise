import sanitizeHtml from "sanitize-html";

const blogHtmlOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    "a",
    "blockquote",
    "br",
    "code",
    "del",
    "em",
    "h2",
    "h3",
    "h4",
    "hr",
    "img",
    "li",
    "mark",
    "ol",
    "p",
    "pre",
    "s",
    "strong",
    "sub",
    "sup",
    "u",
    "ul",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    h2: ["style"],
    h3: ["style"],
    h4: ["style"],
    img: ["src", "alt", "title", "width", "height"],
    p: ["style"],
  },
  allowedStyles: {
    h2: { "text-align": [/^(left|center|right|justify)$/] },
    h3: { "text-align": [/^(left|center|right|justify)$/] },
    h4: { "text-align": [/^(left|center|right|justify)$/] },
    p: { "text-align": [/^(left|center|right|justify)$/] },
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["https"] },
  allowProtocolRelative: false,
  transformTags: {
    a: (_tagName, attributes) => ({
      tagName: "a",
      attribs: { ...attributes, rel: "noopener noreferrer nofollow" },
    }),
  },
};

export function sanitizeWebsiteBlogHtml(value: string): string {
  return sanitizeHtml(value, blogHtmlOptions);
}

export function hasWebsiteBlogText(value: string): boolean {
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/&nbsp;|&#160;/gi, " ")
    .trim().length > 0;
}
