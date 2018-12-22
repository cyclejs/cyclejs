import xs from 'xstream'
import { div, h1} from '@cycle/dom'




export default function (sources: any) {
    
    

    const request$ = xs.of({
        url: 'http://localhost:8080/hello', // GET method by default
        category: 'hello',
    });

    const response$ = sources.HTTP
        .select('hello')
        .flatten();

    const vdom$ = response$
        .map((res: any) => res.text) // We expect this to be "Hello World"
        .startWith('Loading...')
        .map((text: string) =>
            div('.container', [
                h1(text)
            ])
        );

    return {
        DOM: vdom$,
        HTTP: request$
    };
}