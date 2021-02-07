## Known Issues
Be aware, that if used together with different tab managing addons like 
"Tree Style Tab", there might be unexpected behavior.

If Firefox is configured to *Never remember history*, the extension won't 
work, because every window instance is handled as *private browsing*.

Github Actions is most likely to fail while publishing the latest version, 
because *web-ext* does not quite well support signing new versions of existing 
apps. Nonetheless it is going to be submitted to AMO for review.
