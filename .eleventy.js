const pluginRss = require("@11ty/eleventy-plugin-rss");

module.exports = function(eleventyConfig) {
  // Add RSS plugin
  eleventyConfig.addPlugin(pluginRss);

  // Watch these additional file types for changes
  eleventyConfig.addWatchTarget("./src/assets/");

  // Copy static assets to output
  eleventyConfig.addPassthroughCopy({"src/assets": "/assets"});
  eleventyConfig.addPassthroughCopy({"src/css": "/css"});

  // Configure markdown to allow HTML in dream posts
  eleventyConfig.setLibrary("md", require("markdown-it")({
    html: true,
    linkify: true,
    typographer: true
  }));

  // Date formatting filter
  eleventyConfig.addFilter("dateDisplay", (dateObj) => {
    return new Date(dateObj).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  });

  // Force Liquid template engine to avoid Nunjucks issues
  eleventyConfig.setTemplateFormats(["html", "md", "liquid"]);

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    }
  };
};