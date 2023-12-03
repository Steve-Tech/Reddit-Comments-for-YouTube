import { marked } from 'marked';
import { buildLemmyUrl } from './RequestTools';
import { REDDIT_LINK_DOMAIN } from '../constants';
import { parseTimestamp } from './TimeTools';
import { Site } from '../types/Site';

export const renderer = new marked.Renderer();
const linkRenderer = renderer.link;
renderer.link = (href, title, text) => {
	const html = linkRenderer.call(renderer, href, title, text);
	return html.replace(/^<a /, '<a target="_blank" ');
};

function commentParser(content: string, site: Site) {
	content = content.replaceAll(/\] \(http/g, '](http');

	content = content.replaceAll(
		/(?<=\s|^|;)([0-5]?\d(?::[0-5]?\d){1,2})(?=\s|$|&|\.)/g,
		(m) => {
			try {
				const timestamp = parseTimestamp(m);
				return `<button onclick='document.dispatchEvent(new CustomEvent("timestampClicked", {detail: { time: ${timestamp}}}))'>[${m}]</button>`;
			} catch {
				console.error('commentParser', `Parsing timestamp ${m} failed.`);
				return '';
			}
		}
	);

	content = content.replaceAll(
		/(?<=\s|^|;)([0-5]?\d(?::[0-5]?\d){1,2})(?=\s|$|&|\.)/g,
		(m) => {
			try {
				const timestamp = parseTimestamp(m);
				return `<button onclick='document.dispatchEvent(new CustomEvent("timestampClicked", {detail: { time: ${timestamp}}}))'>[${m}]</button>`;
			} catch {
				console.error('commentParser', `Parsing timestamp ${m} failed.`);
				return '';
			}
		}
	);

	return content;
}

export async function redditCommentParser(content: string, site: Site) {
	content = commentParser(content, site);
	content = content.replaceAll(
		/(\/?r\/(\w*))/g,
		`[$1](${REDDIT_LINK_DOMAIN}/r/$2)`
	);
	content = content.replaceAll(
		/(\/?u\/([\w-]*))/g,
		`[$1](${REDDIT_LINK_DOMAIN}/user/$2)`
	);
	content = content.replaceAll(
		/>!(.*?)!</g,
		`<button class='reddit-spoiler' onclick='this.classList.toggle("reddit-spoiler")'>$1</button>`
	);

	return await marked(content, { renderer });
}

export async function lemmyCommentParser(content: string, site: Site) {
	content = commentParser(content, site);
	content = content.replaceAll(
		/!(\w*?@[\w.]*)/g,
		`[!$1](${await buildLemmyUrl('c/$1')})`
	);
	content = content.replaceAll(
		/@([\w-]*?@[\w.]*)/g,
		`[@$1](${await buildLemmyUrl('u/$1')})`
	);

	return await marked(content, { renderer });
}