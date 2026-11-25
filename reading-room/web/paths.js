'use strict';

// A path is a set of choices within a college. A slot with explicit catalog
// evidence uses a single section; older course selections use a set of checkboxes.
const pathState = {school:'Grinnell College', group:'in'};
const schoolRoutes = {
  grinnell:'Grinnell College',
  yale:'Yale University',
  usf:'University of South Florida',
  mit:'Massachusetts Institute of Technology'
};

function collegePath(slug) {
  if (Object.hasOwn(schoolRoutes, slug) && corpus.courses.some(course => course.school === schoolRoutes[slug])) {
    pathState.school = schoolRoutes[slug];
    pathState.group = 'in';
  }
  paths();
}
function pathCourses() {
  return corpus.courses.filter(course => course.school === pathState.school);
}
function choiceSlot() {
  return corpus.slots.find(slot => slot.school === pathState.school);
}
function chosenCourses() {
  const slot = choiceSlot();
  const saved = state.paths?.[slot?.id || pathState.school];
  const candidates = pathCourses().filter(course => !slot || courseInfo(course).slot === slot.id);
  const valid = Array.isArray(saved) ? saved.filter(id => candidates.some(course => course.id === id)) : [];
  return slot
    ? [valid[0] || candidates[0].id]
    : Array.isArray(saved) ? valid : [candidates[0].id];
}
function courseCard(course, selected, single) {
  const status = courseInfo(course);
  const input = single
    ? '<input type="radio" name="intro-section" data-path-course="'+course.id+'" '+(selected?'checked':'')+'>'
    : '<input type="checkbox" data-path-course="'+course.id+'" '+(selected?'checked':'')+'>';
  return [
    '<article class="compare-card path-card">',
    '<label class="path-choice">'+input+'<span>'+esc(course.code+' · '+course.term)+'</span></label>',
    '<h3>'+esc(course.title)+'</h3>',
    '<p class="small">'+esc(course.instructor)+'</p>',
    '<p class="small path-card-scope">'+esc(course.coverage)+'</p>',
    '<div class="sourceLine">'+courseSourceLink(course)+'</div>',
    status.status === 'unknown' ? '<p class="small review-status">Reading list unknown</p>' : '',
    '</article>'
  ].join('');
}
function paths() {
  const school = pathState.school;
  const offered = pathCourses();
  const selected = chosenCourses();
  const slot = choiceSlot();
  const choices = slot ? offered.filter(course => courseInfo(course).slot === slot.id) : offered;
  const outsideSlot = slot ? offered.filter(course => courseInfo(course).slot !== slot.id) : [];
  const schools = [...new Set(corpus.courses.map(course => course.school))];
  const title = slot ? slot.title : 'Reading by college';
  document.title = title+' · Blackball';
  content.innerHTML = [
    '<div class="pagehead"><div><p class="kicker">Liberal arts / Courses</p><h1>'+esc(title)+'</h1>',
    '<p class="sub">'+esc(slot?.rule || 'Choose courses to see their documented reading lists.')+'</p>',
    slot ? '<p class="sourceLine path-rule">'+external('Degree requirements',slot.rule_url)+' '+external(slot.term_label,slot.term_url)+'</p>' : '',
    '</div></div>',
    '<label class="field-label" for="path-school">College</label>'+select('path-school','College',schools.map(s=>[s,s]),school),
    '<div class="panel-group path-courses">'+choices.map(course=>courseCard(course,selected.includes(course.id),!!slot)).join('')+'</div>',
    '<section aria-label="Readings from your course choice"><div id="path-results"></div></section>',
    outsideSlot.length ? '<div class="detail-section"><details class="fold"><summary>Other Grinnell offerings</summary><div class="stack copyline">'+outsideSlot.map(course=>
      '<p><b>'+esc(course.title)+'</b> · '+esc(course.code+' · '+course.term)+'<br><span class="small">'+esc(course.coverage)+'</span><br>'+courseSourceLink(course)+'</p>'
    ).join('')+'</div></details></div>' : '',
  ].join('');
  drawPath();
}

function drawPath() {
  const collegeCourses = pathCourses();
  const selected = chosenCourses();
  const slot = choiceSlot();
  const panel = document.querySelector('#path-results');
  if (slot) {
    const selectedCourse = getCourse(selected[0]);
    const otherSection = collegeCourses.find(course => courseInfo(course).slot === slot.id && course.id !== selectedCourse.id);
    const diff = compareCourses(selectedCourse.id, otherSection.id);
    const groups = {in:courseRows(selectedCourse.id), shared:diff.both, only:diff.left, other:diff.right};
    const names = {in:'My section', shared:'On both lists', only:'Only my section', other:'Only the other section'};
    const context = '<p class="small path-coverage">'+esc(slot.scope)+' '+link('Compare assignments side by side','compare/'+selectedCourse.id+'/'+otherSection.id,'quietlink')+'</p>';
    drawPathGroups(panel, groups, names, context);
    return;
  }

  const observed = collegeCourses.filter(course => courseInfo(course).status !== 'unknown');
  const assigned = observed.flatMap(course => courseRows(course.id));
  const chosen = assigned.filter(row => selected.includes(row.course));
  const chosenIds = new Set(chosen.map(row => row.work));
  const uniqueWorks = rows => [...new Map(rows.map(row => [row.work,row])).values()];
  const unavailable = selected.map(getCourse).filter(course => courseInfo(course).status === 'unknown');
  const context = unavailable.map(course => '<p class="empty">'+esc(course.code)+' · Reading list unknown. '+courseSourceLink(course)+'</p>').join('');
  const groups = {in:uniqueWorks(chosen),other:uniqueWorks(assigned.filter(row => !chosenIds.has(row.work)))};
  drawPathGroups(panel, groups, {in:'My course choices',other:'Other reviewed lists'}, context);
}
function drawPathGroups(panel, groups, names, context) {
  const group = Object.hasOwn(groups,pathState.group) ? pathState.group : 'in';
  const rows = groups[group];
  panel.innerHTML = '<div class="tabs" aria-label="Reading lists">'+Object.keys(groups).map(key =>
    '<button data-action="path-group" data-key="'+key+'" aria-pressed="'+(group===key)+'">'+names[key]+' <span class="count">'+groups[key].length+'</span></button>'
  ).join('')+'</div>'+context+(rows.length
    ? '<div class="books">'+rows.map(row=>bookRow(getBook(row.work),row.course)).join('')+'</div>'
    : '<p class="empty">No matching entries in the reviewed reading lists.</p>');
}
document.addEventListener('change',event => {
  const control = event.target;
  if (control.id === 'path-school') {
    pathState.school = control.value;
    pathState.group = 'in';
    const slug = Object.keys(schoolRoutes).find(key => schoolRoutes[key] === control.value);
    history.replaceState(null,'','#path'+(slug?'/'+slug:''));
    paths();
    document.querySelector('#path-school').focus();
  }
  if (control.dataset.pathCourse) {
    const slot = choiceSlot();
    const chosen = chosenCourses().filter(id => id !== control.dataset.pathCourse);
    const next = slot ? [control.dataset.pathCourse] : control.checked ? [...chosen,control.dataset.pathCourse] : chosen;
    state.paths ||= {};
    state.paths[slot?.id || pathState.school] = next;
    saveState();
    pathState.group = 'in';
    drawPath();
  }
});
document.addEventListener('click',event => {
  const control = event.target.closest('[data-action="path-group"]');
  if (!control) return;
  pathState.group = control.dataset.key;
  drawPath();
  document.querySelector('[data-action="path-group"][data-key="'+control.dataset.key+'"]').focus({preventScroll:true});
});
