export function createEmbed({ color, title, description, footerText }) {
  return {
    color,
    title,
    description,
    timestamp: new Date().toISOString(),
    footer: {
      text: footerText,
    },
  };
}
