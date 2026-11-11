import "../styles.css";
import "./education-skills.css";

const asset = (name) => `${process.env.PUBLIC_URL || ""}/education/${name}`;

function CampusPhoto({ file, alt, caption, width, height, className = "" }) {
  return <figure className={`edu-photo ${className}`}>
    <img src={asset(file)} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
    <figcaption>{caption}</figcaption>
  </figure>;
}

export default function Education() {
  return (
    <div className="page-container education-page">
      <header className="learning-intro">
        <div><p className="eyebrow">EDUCATION / ALEX CASTRO</p><h1>Always learning.</h1></div>
        <p className="learning-deck">Computer science foundations.<br />A wider world of ideas.</p>
      </header>

      <section className="edu-fordham" aria-labelledby="fordham-heading">
        <div className="edu-section-label"><span>01 / THE FOUNDATION</span><span>NEW YORK, USA</span></div>
        <h2 id="fordham-heading">Fordham University</h2>
        <CampusPhoto file="fordham.jpg" width="1280" height="720" alt="Cunniffe House at Fordham University's Rose Hill campus, framed by trees and a lawn" caption="Cunniffe House · Rose Hill campus" className="edu-main-photo" />
        <div className="edu-degrees">
          <article className="edu-degree">
            <span className="edu-degree-mark" aria-hidden="true">MS</span>
            <div><p className="edu-date">Grad. Fall 2022</p><h3>MS in Computer Science</h3>
              <p>Machine learning, data modeling, data preparation, classification, regression, clustering, association rules mining, and visualization.</p>
              <div className="edu-research"><span className="eyebrow">RESEARCH / IEEE COINS 2022</span><p>Co-authored <a href="https://ieeexplore.ieee.org/document/9854976" target="_blank" rel="noopener noreferrer">ScreenCoin: A Blockchain-Enabled Decentralized Ad Network</a>, published at IEEE COINS 2022.</p></div>
            </div>
          </article>
          <article className="edu-degree">
            <span className="edu-degree-mark" aria-hidden="true">BS</span>
            <div><p className="edu-date">Grad. Spring 2017</p><h3>BS in Computer Science</h3><ul><li>American Studies Honors Program</li><li>Sigma Xi Nominee</li></ul></div>
          </article>
        </div>
      </section>

      <section className="edu-abroad" aria-labelledby="abroad-heading">
        <div className="edu-section-label"><span>02 / A BROADER PERSPECTIVE</span></div>
        <h2 id="abroad-heading">Learning across borders.</h2>
        <div className="edu-abroad-grid">
          <article>
            <CampusPhoto file="esade.jpg" width="1024" height="768" alt="The glass and brick exterior of Esade Creapolis in Sant Cugat" caption="Esade Creapolis · Sant Cugat" />
            <p className="edu-date">Summer 2014</p><h3>Esade - Ramon Llull University</h3><p className="edu-program">College Courses</p>
          </article>
          <article>
            <CampusPhoto file="oxford.jpg" width="1280" height="430" alt="Aerial panorama of Oxford's university buildings and green spaces" caption="Oxford · University city panorama" />
            <p className="edu-date">Winter 2013</p><h3>University of Oxford</h3><p className="edu-program">IB® Courses</p>
          </article>
        </div>
      </section>

      <section className="edu-barcelona" aria-labelledby="barcelona-heading">
        <div className="edu-barcelona-note"><span className="eyebrow">03 / WHERE IT BEGAN</span><span className="edu-bcn" aria-hidden="true">BCN<span>41° N / 2° E</span></span></div>
        <div><p className="edu-date">Grad. Spring 2013</p><h2 id="barcelona-heading">American School of Barcelona</h2><p className="edu-program">High School</p><ul><li>International Baccalaureate® (IB) Diploma</li><li>American High School Diploma</li></ul></div>
      </section>
      <details className="asset-credits"><summary>Photography & credits</summary><p>Campus photographs illustrate the institutions, not specific course locations.</p><ul>
        <li>Fordham: <a href="https://commons.wikimedia.org/wiki/File:Cunniffe_House,_2017.jpg">Cunniffe House, 2017</a> by Indefatigable2, <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</li>
        <li>Esade: <a href="https://commons.wikimedia.org/wiki/File:EsadeCreapolis.jpg">EsadeCreapolis</a> by Castellbo, <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a>.</li>
        <li>Oxford: <a href="https://commons.wikimedia.org/wiki/File:1_oxford_aerial_panorama_2016.jpg">Oxford aerial panorama, 2016</a> by Chensiyuan, <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</li>
      </ul><p>Images resized and cropped in the layout. No endorsement implied.</p></details>
    </div>
  );
}
