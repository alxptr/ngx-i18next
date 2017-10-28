import {
	Injectable,
	Inject,
	InjectionToken,
	LOCALE_ID
} from "@angular/core";

import {LoggerFactory, ILogger} from 'ts-smart-logger/index';

@Injectable()
export class TranslateI18NextLanguagesSupport {

	private static logger: ILogger = LoggerFactory.makeLogger(TranslateI18NextLanguagesSupport);

	constructor(@Inject(LOCALE_ID) private locale: InjectionToken<string>) {
	}

	public getSupportedLanguage(supportedLanguages?: Array<string>): string {
		const currentLocale: string = this.locale.toString();

		if (this.isLangSupported(currentLocale, supportedLanguages)) {
			return currentLocale;
		}

		TranslateI18NextLanguagesSupport.logger.debug(
			`[$SupportedLanguageHelper][getSupportedLanguage]: The language '${currentLocale}' is not supported, therefore we try to select as close as possible`
		);

		let resultLng: string = currentLocale;

		currentLocale.toLowerCase()
			.split("-")
			.reverse()
			.forEach((lng: string) => {
				if (this.isLangSupported(lng, supportedLanguages)) {
					TranslateI18NextLanguagesSupport.logger.debug(`[$SupportedLanguageHelper][getSupportedLanguage]: We have found closely supported language '${lng}'`);
					resultLng = lng;
				}
			});

		return resultLng;
	}

	private isLangSupported(lng: string, supportedLanguages?: Array<string>) {
		return !Array.isArray(supportedLanguages) ||
			(Array.isArray(supportedLanguages) && supportedLanguages.indexOf(lng) > -1);
	}
}
