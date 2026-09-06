import { describe, expect, it } from "vitest";
import { definePlaylist, type RecordTrack } from "@/lib/record-playlist";

const track: RecordTrack = {
  id: "cover",
  title: "A cover",
  author: "Composer",
  audioSrc: "https://media.example.com/cover.m4a",
};

describe("authored record playlist", () => {
  it("accepts ordered records with optional metadata and site-relative audio", () => {
    const tracks = [
      track,
      { ...track, id: "two", audioSrc: "/music/two.mp3", record: "Album" },
    ];
    expect(definePlaylist(tracks)).toEqual(tracks);
    expect(definePlaylist([])).toEqual([]);
  });

  it("rejects duplicate IDs and missing metadata before rendering", () => {
    expect(() => definePlaylist([track, track])).toThrow("unique");
    expect(() => definePlaylist([{ ...track, title: " " }])).toThrow(
      "title and author",
    );
    expect(() => definePlaylist([{ ...track, author: "" }])).toThrow(
      "title and author",
    );
  });

  it("rejects unsafe or ambiguous media and attribution URLs", () => {
    for (const audioSrc of [
      "javascript:alert(1)",
      "//example.com/song.mp3",
      "music/file.mp3",
      "",
    ]) {
      expect(() => definePlaylist([{ ...track, audioSrc }])).toThrow("HTTPS");
    }
    expect(() =>
      definePlaylist([{ ...track, videoUrl: "http://example.com" }]),
    ).toThrow("HTTPS");
  });
});
