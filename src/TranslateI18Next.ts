import {
    Injectable,
    Inject
} from '@angular/core';

import {LoggerFactory, ILogger} from 'ts-smart-logger';

import {LanguageDetectorAdapter} from './browser/LanguageDetectorAdapter';
import {ILanguageDetector} from './browser/ILanguageDetector';
import {I18NextOptions, ITranslationKeyMapping} from './I18NextOptions';
import {TranslateI18NextLanguagesSupport} from "./TranslateI18NextLanguageDetector";

const i18next = require('i18next'),
    i18nextXHRBackend = require('i18next-xhr-backend');

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

        const browserLanguageDetector: {new(): ILanguageDetector} = options.browserLanguageDetector
            ? LanguageDetectorAdapter.toBrowserLanguageDetector(options.browserLanguageDetector)
            : LanguageDetectorAdapter.toBrowserLanguageDetector({
            detect: (): string => this.translateI18NextLanguagesSupport.getSupportedLanguage(options.supportedLanguages)
        });

        TranslateI18Next.logger.debug('[$TranslateI18Next] Fallback language is', fallbackLng, '. The browser language detector is', browserLanguageDetector);

        this.mapping = options.mapping || this.mapping;

        return this.i18nextPromise =
            new Promise<void>((resolve:(thenableOrResult?:void | Promise<void>) => void, reject:(error:any) => void) => {
                i18next
                    .use(i18nextXHRBackend)
                    .use(browserLanguageDetector)
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
