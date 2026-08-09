# Nielsen UX Audit

Date: 2026-08-02
Scope: Home, Community, post detail, challenge detail, My page, keyboard flows

## Summary

Current UX is visually warmer and cleaner after the community/My page redesign, but a few usability gaps remain before release.

## Priority Fixes

| Priority | Area | Issue | Recommended fix | Status |
| --- | --- | --- | --- | --- |
| P1 | Challenge detail | No report action for challenge posts | Add a report action if backend supports challenge reporting | Waiting for API |
| P1 | Image states | Missing/loading failed images look similar to empty content | Add clear image fallback and optional retry state | Done |
| P1 | Community search | Posts will become hard to find as content grows | Add search when board volume grows beyond category browsing | Later |
| P2 | Challenge grid/detail | Grid is square and edge-to-edge, detail image is rounded card | Decide one visual language and align detail image with grid | Done |
| P2 | Community header | Count pill shows a bare number without context | Remove it or label it by active tab | Done |
| P2 | Challenge grid | 3x3 photos hide tutorial context | Optionally add a subtle tutorial-name overlay | Skipped |

## Nielsen 10 Heuristics

| # | Principle | Status | Notes |
| --- | --- | --- | --- |
| 1 | Visibility of system status | Partial | Loading states exist. Like/report/challenge tap feedback is still light. |
| 2 | Match between system and real world | Good | Korean labels are mostly natural. My page uses `포인트`. |
| 3 | User control and freedom | Partial | Back/cancel flows exist. Challenge detail lacks report/share actions. |
| 4 | Consistency and standards | Good | Community/My/detail tone is consistent. Challenge grid and detail photo treatment are aligned. |
| 5 | Error prevention | Partial | Empty comment submit is blocked. List like tap vs card navigation should be checked on device. |
| 6 | Recognition rather than recall | Partial | Tabs/categories are visible. Challenge grid loses tutorial context until detail open. |
| 7 | Flexibility and efficiency | Partial | Category browsing exists. Search may be needed as board volume increases. |
| 8 | Aesthetic and minimalist design | Good | Fake data removed, image-first challenge grid is cleaner. Bare count pill removed. |
| 9 | Error recovery | Good | Not-found, load-fail, and retry states exist on community, detail, and My page flows. |
| 10 | Help and documentation | OK | Separate help is unnecessary for now; inline empty states are enough. |

## QA Checklist

- [ ] Tap challenge grid item and verify detail opens with large image.
- [ ] Verify challenge detail back button returns to the same community tab.
- [ ] Test image missing state in challenge grid and detail.
- [ ] Turn off network and verify retry states on community, detail, and My page.
- [ ] Tap like button in community list and confirm it does not accidentally open detail.
- [ ] Open keyboard on post detail comment input and confirm input is not covered.
- [ ] Submit empty comment and confirm button stays disabled.
- [ ] Submit report and confirm success/failure messages are understandable.
- [ ] Check bottom tab color on community, detail, and My page.
- [ ] Verify no fake level/view count/placeholder metrics are visible.
