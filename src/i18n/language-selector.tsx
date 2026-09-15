"use client";

import { useState } from "react";
import { Button, Menu, MenuItem, MenuTrigger, Popover } from "react-aria-components";
import { useTranslation } from "./client";
import { getTranslations, translate } from "./core";
import { localeDetails, locales, type Locale } from "./config";

export function LanguageSelector({ mobile = false }: { mobile?: boolean }) {
  const { locale, setLocale, Translate } = useTranslation();
  const [announcement, setAnnouncement] = useState("");

  function changeLocale(nextLocale: Locale) {
    const nextTranslate = getTranslations(nextLocale);
    setAnnouncement(
      translate(nextLocale, nextTranslate.language.changed, {
        language: localeDetails[nextLocale].name,
      }),
    );
    setLocale(nextLocale);
  }

  return (
    <div className={`language-selector${mobile ? " language-selector-mobile" : ""}`}>
      <MenuTrigger>
        <Button
          className="language-trigger"
          aria-label={`${Translate.language.select}: ${localeDetails[locale].name}`}
        >
          <span aria-hidden="true">{locale.toUpperCase()}</span>
        </Button>
        <Popover className="language-popover" placement="bottom end" offset={6}>
          <Menu className="language-menu" aria-label={Translate.language.select}>
            {locales
              .filter((item) => item !== locale)
              .map((item) => (
                <MenuItem
                  key={item}
                  id={item}
                  className="language-menu-item"
                  aria-label={localeDetails[item].name}
                  onAction={() => changeLocale(item)}
                  textValue={localeDetails[item].name}
                >
                  <span aria-hidden="true" lang={item}>
                    {item.toUpperCase()}
                  </span>
                </MenuItem>
              ))}
          </Menu>
        </Popover>
      </MenuTrigger>
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
