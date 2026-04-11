const pluginRss = require("@11ty/eleventy-plugin-rss");
const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  // Add RSS plugin
  eleventyConfig.addPlugin(pluginRss);

  // Add date filter for Nunjucks
  eleventyConfig.addFilter("date", (dateObj, format) => {
    return DateTime.fromJSDate(new Date(dateObj), { zone: "utc" }).toFormat(format);
  });

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

  // Create collections for categories
  eleventyConfig.addCollection("essays", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/**/*.md")
      .filter(item => item.data.category === "essay")
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("personal", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/**/*.md")
      .filter(item => item.data.category === "personal")
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("archive", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/**/*.md")
      .filter(item => item.data.category === "archive")
      .sort((a, b) => b.date - a.date);
  });

  // All posts collection (mixed)
  eleventyConfig.addCollection("allPosts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/**/*.md")
      .filter(item => item.data.category)
      .sort((a, b) => b.date - a.date);
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    }
  };
};