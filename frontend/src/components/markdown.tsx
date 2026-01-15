import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

export interface MarkdownProps {
  content: string;
  class?: string;
}

export const Markdown = component$<MarkdownProps>(({ content, class: extraClass = "" }) => {
  const processedContent = useSignal<string>("");

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    const mdContent = track(() => content);
    
    if (mdContent) {
      try {
        const file = await unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkRehype, { allowDangerousHtml: false })
          .use(rehypeStringify, { 
            allowDangerousHtml: false,
            allowDangerousCharacters: false 
          })
          .process(mdContent);
        
        let str = String(file);
        
        // Replace Discord emojis with proper img tags
        str.match(/&#x3C;(a?):(\w+):(\d+)>/g)?.forEach((match: string) => {
          const emoji = match.match(/&#x3C;(a?):\w+:(\d+)>/)!;
          const animated = emoji[1] == 'a';
          const id = emoji[2];
          str = str.replace(match, `<img src="https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}" class="inline h-5" alt="emoji" />`);
        });
        
        // Additional security: strip any remaining script tags that might have slipped through
        str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        str = str.replace(/javascript:/gi, '');
        str = str.replace(/on\w+\s*=/gi, '');
        
        processedContent.value = str;
      } catch (error) {
        console.warn("Failed to process markdown:", error);
        // Fallback to HTML-escaped plain text
        processedContent.value = mdContent
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      }
    } else {
      processedContent.value = "";
    }
  });

  return (
    <div 
      dangerouslySetInnerHTML={processedContent.value} 
      class={`whitespace-pre-line [&>p>a]:text-blue-400 [&>p>a]:hover:underline [&>p]:mb-2 [&>h1]:text-xl [&>h1]:font-bold [&>h2]:text-lg [&>h2]:font-semibold [&>h3]:font-medium [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4 [&>blockquote]:border-l-4 [&>blockquote]:border-gray-400 [&>blockquote]:pl-4 [&>blockquote]:italic ${extraClass}`} 
    />
  );
});
