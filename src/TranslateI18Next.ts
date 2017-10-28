import {
    Injectable,
    Inject
} from '@angular/core';

import {LoggerFactory, ILogger, IEnvironmentLogger} from 'ts-smart-logger/index';

import {LanguageDetectorAdapter} from './browser/LanguageDetectorAdapter';
import {ILanguageDetector} from './browser/ILanguageDetector';
import {I18NextOptions, ITranslationKeyMapping} from './I18NextOptions';
import {TranslateI18NextLanguagesSupport} from './TranslateI18NextLanguageDetector';

const i18next = require('i18next/index'),
    i18nextXHRBackend = require('i18next-xhr-backend/index');

@Injectable()
export class TranslateI18Next {

    private static logger: ILogger = LoggerFactory.makeLogger(TranslateI18NextLanguagesSupport);

    private i18nextPromise:Promise<void>;
    private mapping:ITranslationKeyMapping = {};

    constructor(@Inject(TranslateI18NextLanguagesSupport) private translateI18NextLanguagesSupport:TranslateI18NextLanguagesSupport) {
    }

    public init(options?:I18NextOptions):Promise<void> {
        options = options || {};

        const fallbackLng:string = options.fallbackLng || 'en';

        const browserLanguageDetectorCtor: {new(): ILanguageDetector} = options.browserLanguageDetector
            ? LanguageDetectorAdapter.toBrowserLanguageDetector(options.browserLanguageDetector)
            : LanguageDetectorAdapter.toBrowserLanguageDetector({
            detect: (): string => this.translateI18NextLanguagesSupport.getSupportedLanguage(options.supportedLanguages)
        });

        TranslateI18Next.logger.debug((logger: IEnvironmentLogger) => {
	        logger.write('[$TranslateI18Next] The fallback language is', fallbackLng,
		        '. The current language has been detected as', new browserLanguageDetectorCtor().detect(),
		        '. The default language detector is looking at <@Inject(LOCALE_ID) locale: InjectionToken<string>> where <import {LOCALE_ID} from "@angular/core">',
	            '. You should provide your current locale for all services using <@NgModule({providers: [{provide: LOCALE_ID, useValue: "en-AU"}]})>',
	            '. See also "supportedLanguages" optional parameter when <TranslateI18Next.init(...)> is called');
        });

        this.mapping = options.mapping || this.mapping;

        // default plugins
        let defaultUse = options.defaultUse || [i18nextXHRBackend, browserLanguageDetectorCtor];
        const pluginsUsed = defaultUse.concat(options.use || []);

        return this.i18nextPromise =
            new Promise<void>((resolve:(thenableOrResult?:void | Promise<void>) => void, reject:(error:any) => void) => {

                // use each plugin
                pluginsUsed.forEach(plugin => {
                    i18next.use(plugin)
                });

                i18next
                    .init(
                        Object.assign({}, options, {
                            fallbackLng: fallbackLng,

                            /**
                             * The keys may contain normal human phrases, i.e. the "gettext format" therefore we should disable "i18next format"
                             */
                            nsSeparator: false,
                            keySeparator: false
                        }),
                        (err:any) => {
                            if (err) {
                                TranslateI18Next.logger.error(err);
                                reject(err);
                            } else {
                                TranslateI18Next.logger.debug('[$TranslateI18Next] The translations has been loaded for the current language', i18next.language);
                                resolve(null);
                            }
                        });
            });
    }

    public translate(key:string, options?:I18NextOptions):string {
        if (key) {
            key = this.mapping[key] || key;
        }

        options = options || {};
        options.interpolation = options.interpolation || {};

        // Angular2 interpolation template should not interfere with i18next interpolation template
        options.interpolation.prefix = "{";
        options.interpolation.suffix = "}";

        return i18next.t(key, options);
    }

    public changeLanguage(lng?:string, callback?:Function) {
        i18next.changeLanguage(lng, callback);
    }
}
