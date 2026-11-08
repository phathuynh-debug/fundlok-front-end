import { describe, expect, it } from "vitest";

import {
  EMAIL_PRESET_IDS,
  EMAIL_PRESET_LANGUAGES,
  emailPresetContent,
} from "./email-presets";

const ALL = EMAIL_PRESET_IDS.flatMap((id) =>
  EMAIL_PRESET_LANGUAGES.map((lang) => [id, lang] as const),
);

describe("emailPresetContent", () => {
  it.each(ALL)("%s (%s) passes the composer's checks", (id, lang) => {
    const preset = emailPresetContent(id, lang);
    // Same limits as the inputs and the backend's EmailContent.
    expect(preset.subject.length).toBeGreaterThan(0);
    expect(preset.subject.length).toBeLessThanOrEqual(200);
    expect(preset.heading.length).toBeLessThanOrEqual(200);
    expect(preset.buttonLabel.length).toBeLessThanOrEqual(60);
    expect(preset.body.length).toBeLessThanOrEqual(10_000);
    expect(preset.buttonUrl).toMatch(/^https:\/\/[^\s/]+\S*$/i);
  });

  it.each(ALL)("%s (%s) body has no newline characters", (id, lang) => {
    // The email template runs nl2br over the body: a newline would add a
    // second line break on top of the <div>s.
    expect(emailPresetContent(id, lang).body).not.toMatch(/[\r\n]/);
  });

  it.each(ALL)("%s (%s) avoids rating language", (id, lang) => {
    const { subject, heading, body } = emailPresetContent(id, lang);
    const text = `${subject} ${heading} ${body}`.toLowerCase();
    for (const banned of [
      "tín nhiệm",
      "chấm điểm",
      "credit score",
      "credit rating",
      "guarantee",
      "đảm bảo lợi nhuận",
    ]) {
      expect(text).not.toContain(banned);
    }
  });

  it("links SMEs to the project form and investors to KYC", () => {
    expect(emailPresetContent("sme_onboarding", "vi").buttonUrl).toMatch(
      /\/project-application$/,
    );
    expect(emailPresetContent("investor_onboarding", "en").buttonUrl).toMatch(
      /\/kyc$/,
    );
  });

  it("returns the language asked for", () => {
    expect(emailPresetContent("investor_onboarding", "vi").body).toContain(
      "Xin chào Quý nhà đầu tư,",
    );
    expect(emailPresetContent("investor_onboarding", "en").body).toContain(
      "Dear Investor,",
    );
  });
});
