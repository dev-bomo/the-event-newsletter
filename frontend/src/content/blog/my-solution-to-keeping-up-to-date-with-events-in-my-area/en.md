---
title: My solution to keeping up to date with events in my area
excerpt: Why I stopped relying on social media for events, and the lightweight system I now use to stay in the loop.
---

Published: 2026-04-10  
Updated: 2026-04-10

## TL;DR

I stopped using social media, but still wanted to discover local events. I built a simple weekly AI-assisted workflow that checks events 60 days ahead, sends one concise email, and helps me filter out things I do not care about.

## Why I left social media

Around 2016, I stopped using Facebook. I realized I was doing a ton of doomscrolling, and I sometimes found myself spending the last 30 minutes in the comment section of some article, hating on commenters. Not engaging. Just disapproving from afar.

I also noticed that this seemed to amplify my current mood or general state of mind. I would scroll more if I felt anxious, I'd spend more time in the comments section, and generally I'd feel more of a need to pick up my phone. And when I'd be outside waiting for someone, I wouldn't know what to do with my hands. Kind of like if I were a smoker.

So yep, me not being a doctor, decided it couldn't be good for me. So I stopped posting, unfollowed everyone, and uninstalled the mobile app.

Fast forward a few years: I never actually missed it. I never felt like I was missing out on much, and never felt like the people I was no longer getting updates about did anything I was really missing out on.

## What I did miss

One thing I did miss, though: the events. Especially the smaller ones, the local ones, the ones from less established sources. Some venues had calendars, some had newsletters. But it turned out there are quite a few sources, and there were always ones I didn't follow that I would later find out about.

## The AI workflow I started using

At some point, I decided to try some AI prompts to see if I could automate part of the work it takes to keep up to date. It worked pretty well. I fed it my preferences, types of entertainment and events, genres, artists, venues, and the like, and it would search the web and give me a list of things I might be interested in.

It's non-deterministic, which is good and bad. It's good in the sense that it'll find all sorts of niche things every once in a while. It's also bad because sometimes it misses simple, obvious things I'd like. This is somewhat mitigated because I have it look 60 days in advance and I check it weekly.

It's cheap, but not free. If you write your own prompt and run it weekly, it'll be basically free because it works on a free ChatGPT or Perplexity plan (or any other, I imagine). But then you'd have to run it manually, you don't get an email, and you'd have to spend a few hours perfecting that prompt. If you want to automate and use an API to access the LLMs, that'll cost more and be harder to do, because it turns out the API calls have to be orchestrated by you. Something the web apps from the providers above do for you. So if you run it yourself and create the prompt yourself, it's free but takes time. If you use a service, it'll cost you a bit.

## Why this became event-newsletter.com

It's pretty unintrusive. Doing it once per week, and tweaking every once in a while, is how I have been running it for a few months now, and I'm much happier with my awareness of stuff going on. In practice, it takes me around 10-15 minutes per week to review and tune. I've also limited it to 20 events per week, so the email is a quick read. It gives me a mix between concerts I normally wouldn't miss because they're known bands at known venues, and small events like yard sales at a local bar, for example.

All in all, I found it was worth my time building, and I figured it may be worth it for others to use too. So that's how [event-newsletter.com](https://event-newsletter.com) came about.

I set it up with my preferences and my location, and I get an email every Thursday with events based on that. When I see an event I'm totally not interested in, I can dislike it, and it'll be attached to my profile so I don't get that in the future. Other than that, I haven't really changed anything related to my profile. And sure, if I ever decide I'm into something new, I can add that to my profile and it'll be picked up for the next newsletter.

If you want to try it, start at [event-newsletter.com](https://event-newsletter.com), and if helpful you can also read the [FAQ](/faq) or check [Pricing](/pricing).
