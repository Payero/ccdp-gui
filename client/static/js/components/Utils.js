
export function toggleRow(component, key){
  const newSelected = Object.assign({}, component.state.selected);
   newSelected[key] = !component.state.selected[key];
   if(!newSelected[key])
   {
     delete newSelected[key]
   }
   if(Object.keys(newSelected).length == 0)
   {
     component.setState({
       selected: newSelected,
       selectAll: 0
     });
   }
   else {
     component.setState({
       selected: newSelected,
       selectAll: 2
     });
   }

}

export function toggleSelectAll(component, key) {
   let newSelected = {};

   if (component.state.selectAll === 0) {
     component.state.data.forEach(x => {
       newSelected[x[key]] = true;
     });
   }
   component.setState({
     selected: newSelected,
     selectAll: component.state.selectAll === 0 ? 1 : 0
   });
 }

export function randomColorGraph(opacity){

  return (
    'rgba(' + Math.round(Math.random() * 255) +
    ',' +Math.round(Math.random() * 255) + ',' +
    Math.round(Math.random() * 255) + ',' + (opacity || '.3') + ')'
  )

}
