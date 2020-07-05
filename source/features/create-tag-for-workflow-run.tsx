import React from 'dom-chef';
import select from 'select-dom';
import delegate from 'delegate-it';

import features from '.';
import * as api from "../github-helpers/api";
import {getRepoURL} from "../github-helpers";

async function handleClick({delegateTarget: button}: delegate.Event<MouseEvent, HTMLButtonElement>): Promise<void> {
	// @ts-ignore
	const workflowRunUrl =  button.closest('.Box-row').querySelector('.h4>a').getAttribute('href');
	// @ts-ignore
	const runEndpoint = 'repos' + workflowRunUrl.replace('/workflow-run/', '/runs/');
	const response = await api.v3(runEndpoint);
	await createTag(response.head_sha);
	button.textContent = 'Tagged!';
}

async function createTag(baseSha: string): Promise<true | string> {
	const response = await api.v3(`repos/${getRepoURL()}/git/refs`, {
		method: 'POST',
		body: {
			sha: baseSha,
			ref: `refs/tags/release-${new Date().getMilliseconds()}-${baseSha.substring(0, 7)}`
		},
		ignoreHTTPStatus: true
	});

	return response.ok || response.message;
}


function renderButton(): void {
	for (const button of select.all('.d-md-table-cell>a.branch-name')) {
		button
			.parentElement! // `BtnGroup`
			.append(
				<button
					className="btn btn-sm tooltipped tooltipped-n float-right tag-on-workflow-run"
					aria-label="Create a tag with release-{sha}"
					type="button"
				>
					Tag
				</button>
			);
	}
}

function removeButton(): void {
	console.log('$$$$removing ');
	select('.tag-on-workflow-run')?.remove();
}

function init(): void {
	delegate(document, '.tag-on-workflow-run', 'click', handleClick);

	if (select.exists('.blob > .markdown-body')) {
		delegate(document, '.rgh-md-source', 'rgh:view-markdown-source', renderButton);
		delegate(document, '.rgh-md-source', 'rgh:view-markdown-rendered', removeButton);
	} else {
		renderButton();
	}
}

void features.add({
	id: __filebasename,
	description: 'Adds a button to copy a file’s content.',
	screenshot: 'https://cloud.githubusercontent.com/assets/170270/14453865/8abeaefe-00c1-11e6-8718-9406cee1dc0d.png'
}, {
	include: [
		function (): boolean {
			return location.href.endsWith('actions');
		}
	],
	init
});
